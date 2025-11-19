import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { streamToString } from "@/lib/utils";
import Stripe from "stripe";
import { Pool } from "pg";

export const dynamic = "force-dynamic";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

const oneCreditPriceId = process.env.STRIPE_PRICE_ID_ONE_CREDIT as string;
const threeCreditsPriceId = process.env.STRIPE_PRICE_ID_THREE_CREDITS as string;
const fiveCreditsPriceId = process.env.STRIPE_PRICE_ID_FIVE_CREDITS as string;

const creditsPerPriceId: {
  [key: string]: number;
} = {
  [oneCreditPriceId]: 1,
  [threeCreditsPriceId]: 3,
  [fiveCreditsPriceId]: 5,
};

// Shared Postgres pool for credits persistence
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || process.env.AZURE_POSTGRES_URL,
});

export async function POST(request: Request) {
  console.log("Request from: ", request.url);
  console.log("Request: ", request);
  const headersObj = headers();
  const sig = headersObj.get("stripe-signature");

  if (!stripeSecretKey) {
    return NextResponse.json(
      {
        message: `Missing stripeSecretKey`,
      },
      { status: 400 }
    );
  }

  const stripe = new Stripe(stripeSecretKey, {
    apiVersion: "2023-08-16",
    typescript: true,
  });

  if (!sig) {
    return NextResponse.json(
      {
        message: `Missing signature`,
      },
      { status: 400 }
    );
  }

  if (!request.body) {
    return NextResponse.json(
      {
        message: `Missing body`,
      },
      { status: 400 }
    );
  }

  const rawBody = await streamToString(request.body);

  let event;

  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, endpointSecret!);
  } catch (err) {
    const error = err as Error;
    console.log("Error verifying webhook signature: " + error.message);
    return NextResponse.json(
      {
        message: `Webhook Error: ${error?.message}`,
      },
      { status: 400 }
    );
  }

  // Handle the event
  switch (event.type) {
    case "checkout.session.completed":
      const checkoutSessionCompleted = event.data
        .object as Stripe.Checkout.Session;
      const userId = checkoutSessionCompleted.client_reference_id;

      if (!userId) {
        return NextResponse.json(
          {
            message: `Missing client_reference_id`,
          },
          { status: 400 }
        );
      }

      const lineItems = await stripe.checkout.sessions.listLineItems(
        checkoutSessionCompleted.id
      );
      const quantity = lineItems.data[0].quantity;
      const priceId = lineItems.data[0].price!.id;
      const creditsPerUnit = creditsPerPriceId[priceId];
      const totalCreditsPurchased = quantity! * creditsPerUnit;

      console.log({ lineItems });
      console.log({ quantity });
      console.log({ priceId });
      console.log({ creditsPerUnit });

      console.log("totalCreditsPurchased: " + totalCreditsPurchased);

      // Persist credits in Postgres (credits table) using userId as key
      if (!process.env.DATABASE_URL && !process.env.AZURE_POSTGRES_URL) {
        console.warn("No DATABASE_URL or AZURE_POSTGRES_URL set; skipping credits persistence.");
      } else {
        const client = await pool.connect();
        try {
          const existing = await client.query(
            "SELECT credits FROM credits WHERE user_id = $1",
            [userId]
          );

          if (existing.rows.length > 0) {
            const current = existing.rows[0].credits ?? 0;
            const newCredits = current + totalCreditsPurchased;
            await client.query(
              "UPDATE credits SET credits = $1, updated_at = NOW() WHERE user_id = $2",
              [newCredits, userId]
            );
          } else {
            await client.query(
              "INSERT INTO credits (user_id, credits) VALUES ($1, $2)",
              [userId, totalCreditsPurchased]
            );
          }
        } catch (err) {
          console.error("Error updating credits in Postgres:", err);
        } finally {
          client.release();
        }
      }

      return NextResponse.json(
        {
          message: "success",
          userId,
          totalCreditsPurchased,
        },
        { status: 200 }
      );

    default:
      return NextResponse.json(
        {
          message: `Unhandled event type ${event.type}`,
        },
        { status: 400 }
      );
  }
}
