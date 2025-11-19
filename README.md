# 🎯 ProfilePerfect AI - The one-click studio for your professional digital identity

Stop using that cropped vacation photo. ProfilePerfect AI transforms your casual selfies into studio-quality, professional headshots perfect for LinkedIn, company bios, and resumes. Our advanced AI preserves your unique identity while providing subtle retouching, background replacement, and style options to present the best version of you.

## ✨ Key Features

- **AI-Powered Generation**: Transform 5-10 selfies into 16-32 professional headshots in minutes
- **Identity-Preserving Retouching**: Subtle enhancements that keep you looking like you
- **Professional Backgrounds**: Studio, office, and creative background options
- **Style Presets**: Corporate, startup, and creative style options
- **Before/After Comparison**: See the transformation with our comparison tool
- **Smart Cropping**: LinkedIn-ready circular crops and avatar presets
- **Credit-Based System**: Pay only for what you need with our flexible pricing

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- Azure PostgreSQL database (shared: `pg-shared-apps-eastus2`)
- Azure OpenAI API key (shared: `shared-openai-eastus2`)
- Azure Storage connection string (shared: `stmahumsharedapps`)
- Stripe account (for payments, optional)

### Installation

1. Clone the repository
```bash
git clone https://github.com/shmindmaster/ProfilePerfectAI.git
cd ProfilePerfectAI
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables
```bash
cp .env.example .env.local
# Fill in your API keys and configuration
```

4. Run the development server
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## 🏗️ Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS, Shadcn/ui components
- **Backend**: Next.js API routes
- **Database**: Azure PostgreSQL (`profileperfect_db` on `pg-shared-apps-eastus2`)
- **Storage**: Azure Blob Storage (`stmahumsharedapps`)
- **Payments**: Stripe
- **AI**: Azure OpenAI (`gpt-image-1-mini` for image generation)
- **Testing**: Playwright (E2E), TypeScript

## 🧪 Testing

ProfilePerfect AI includes a comprehensive E2E test suite with mobile-first testing.

### Running Tests

```bash
# Run all E2E tests
npm run test:e2e

# Run tests in UI mode (interactive)
npm run test:e2e:ui

# Run tests with browser visible
npm run test:e2e:headed

# Run mobile tests only
npm run test:e2e:mobile

# Run desktop tests only
npm run test:e2e:desktop

# View test report
npm run test:e2e:report
```

### Test Coverage

Our E2E test suite covers:
- Homepage and landing experience (mobile-first)
- Navigation and routing (all viewports)
- Image upload flow (validation, limits, mobile camera)
- AI generation process
- Authentication and demo mode
- Responsive layouts (mobile, tablet, desktop)
- Accessibility (WCAG AA compliance)
- Error handling and edge cases

For detailed test cases and documentation, see [TESTING.md](./TESTING.md).

## 📋 Development Phases

### Phase 1: Foundation ✅
- [x] Repository initialization
- [x] Brand rebranding
- [x] Basic project structure

### Phase 2: Generation Flow (In Progress)
- [ ] Database schema updates
- [ ] AI abstraction layer
- [ ] Generation API endpoints
- [ ] UI refactoring for generation

### Phase 3: Studio & Retouch Flow
- [ ] Retouch API endpoints  
- [ ] Studio Editor modal
- [ ] Background replacement
- [ ] Cropping tools

### Phase 4: Polish & Deploy
- [ ] Error handling improvements
- [ ] Final testing
- [ ] Production deployment

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE.md) file for details.

## 🔗 Links

- [Live Demo](https://profileperfect-ai.azurewebsites.net)
- [Documentation](https://docs.profileperfect.ai)
- [Support](mailto:support@profileperfect.ai)

---

**Transform your casual photos into professional headshots with ProfilePerfect AI** 🎯

This will create the tables with their respective columns and RLS policies:

- credits
- images
- models
- samples

### 2. Clone your newly created repo:

```
git clone {{your-repo-name}}
```

### 3. Enter your newly created repo's directory:

```
cd {{your-repo-name}}
```

### 4. Install dependencies:

For npm:

```bash
npm install
```

For yarn:

```bash
yarn
```

### 5. Database Setup

Run the database setup script to create tables and seed sample data:

```bash
# Set environment variables
export POSTGRES_PASSWORD="WalidSahab112025"
export POSTGRES_USER="pgadmin"
export POSTGRES_HOST="pg-shared-apps-eastus2.postgres.database.azure.com"
export POSTGRES_DB="profileperfect_db"
export DATABASE_URL="postgresql://pgadmin:WalidSahab112025@pg-shared-apps-eastus2.postgres.database.azure.com:5432/profileperfect_db?sslmode=require"

# Run setup
node scripts/setup-azure-db.js
```

Or use PowerShell:

```powershell
$env:DATABASE_URL = "postgresql://pgadmin:WalidSahab112025@pg-shared-apps-eastus2.postgres.database.azure.com:5432/profileperfect_db?sslmode=require"
node scripts/setup-azure-db.js
```

### 6. Configure Azure Resources

Get your Azure credentials:

```bash
# Azure OpenAI API Key
az cognitiveservices account keys list \
  --resource-group rg-shared-ai \
  --name shared-openai-eastus2 \
  --query key1 -o tsv

# Azure Storage Connection String
az storage account show-connection-string \
  --resource-group rg-shared-ai \
  --name stmahumsharedapps \
  --query connectionString -o tsv
```

Add these to your `.env.local` file.
### 7. Configure the Announcement Bar (Optional)

To enable and customize the announcement bar at the top of your site, configure these environment variables in your `.env.local`:

```text
# Announcement Bar Configuration
NEXT_PUBLIC_ANNOUNCEMENT_ENABLED=true # set to false to disable the announcement bar
NEXT_PUBLIC_ANNOUNCEMENT_MESSAGE="Your announcement message here" # the message to display
```


### 8. Azure Storage Containers

The setup script will create the required containers automatically:

```powershell
powershell scripts/profileperfect-setup.ps1
```

This creates:
- `profileperfect-uploads` - For user-uploaded photos
- `profileperfect-generated` - For generated headshots

### 9. Create a [Resend](https://resend.com/) account (Optional)

- Fill in `your-resend-api-key` with your Resend API Key if you wish to use Resend to email users when their model has finished training.

### 10. Configure [Stripe](https://stripe.com) to bill users on a credit basis. (Optional)

The current setup is for a credit based system. 1 credit = 1 model train.

To enable Stripe billing, you will need to fill out the following fields in your `.env.local` file:

- STRIPE_SECRET_KEY=your-stripe-secret-key
- STRIPE_WEBHOOK_SECRET=your-stripe-webhook-secret
- STRIPE_PRICE_ID_ONE_CREDIT=your-stripe-price-id-one-credit
- STRIPE_PRICE_ID_THREE_CREDITS=your-stripe-price-id-three-credit
- STRIPE_PRICE_ID_FIVE_CREDITS=your-stripe-price-id-five-credit
- NEXT_PUBLIC_STRIPE_IS_ENABLED=false # set to true to enable Stripe payments

You need to do multiple things to get Stripe working:

- Get your Stripe API secret key from the [Stripe Dashboard](https://dashboard.stripe.com/test/apikeys)
- Create a [Stripe Webhook](https://dashboard.stripe.com/test/webhooks) that will point to your hosted URL. The webhook should be listening for the `checkout.session.completed` event. The webhook should point to `your-hosted-url/stripe/subscription-webhook`.
- Create a [Stripe Price](https://dashboard.stripe.com/test/products) for each credit package you want to offer.
- Create a [Stripe Pricing Table](https://dashboard.stripe.com/test/pricing-tables) and replace the script @/components/stripe/StripeTable.tsx with your own values. It should look like this:

```js
<stripe-pricing-table
  pricing-table-id="your-stripe-pricing-table-id"
  publishable-key="your-stripe-publishable-key"
  client-reference-id={user.id}
  customer-email={user.email}
></stripe-pricing-table>
```

Here are the products you need to create to get Stripe working with our example, checkout the images [Here](/public/Stripe/)

To create them go on the Stripe dashboard, search for Product Catalog and then click on the add product button on the top right of the screen. You will need to create 3 products, one for each credit package as shown in the images before. We set them to One time payments, but you can change that if you want to and you can set the price too. After creating the products make sure to update the variables in the .env.local [your-stripe-price-id-one-credit, your-stripe-price-id-three-credit, your-stripe-price-id-five-credit] with their respective price ids, each price id is found in the product page at the bottom.

### 11. Start the development server:

For npm:

```bash
npm run dev
```

For yarn:

```bash
yarn dev
```

### 12. Visit `http://localhost:3000` in your browser to see the running app.

## One-Click Deploy

Default deploy using Vercel:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fastria-ai%2Fheadshots-starter%2Ftree%2Fmain&env=ASTRIA_API_KEY,APP_WEBHOOK_SECRET&envDescription=Set%20up%20environment%20variables%20for%20Astria%20AI%20and%20redirect%20URL%20in%20Supabase%20Auth%20dashboard.%20See%20.env.local.example%20for%20full%20config%20with%20Resend%20and%20Stripe.&envLink=https%3A%2F%2Fgithub.com%2Fleap-ai%2Fheadshots-starter%2Fblob%2Fmain%2F.env.local.example&project-name=headshots-starter-clone&repository-name=headshots-starter-clone&demo-title=AI%20Headshot%20Generator&demo-description=A%20Professional%20AI%20headshot%20generator%20starter%20kit%20powered%20by%20Next.js%2C%20Leap%20AI%2C%20and%20Vercel&demo-url=https%3A%2F%2Fwww.getheadshots.ai%2F&demo-image=https%3A%2F%2Fimages.ctfassets.net%2Fe5382hct74si%2F1CEDfTwO5vPEiNMgN2Y1t6%2F245d1e0c11c4d8e734fbe345b9ecdc7c%2Fdemo.png&integration-ids=oac_VqOgBHqhEoFTPzGkPd7L0iH6&external-id=https%3A%2F%2Fgithub.com%2Fleap-ai%2Fheadshots-starter%2Ftree%2Fmain)


## How To Get Good Results

[![Good results Demo](/public/good_results.png)](https://blog.tryleap.ai/create-an-ai-headshot-generator-fine-tune-stable-diffusion-with-leap-api/#step-1-gather-your-image-samples-%F0%9F%93%B8)

The image samples used to teach the model what your face looks like are critical. Garbage in = garbage out.

- Enforce close-ups of faces and consider cropping so that the face is centered.
- Enforce images with only one person in the frame.
- Avoid accessories in samples like sunglasses and hats.
- Ensure the face is clearly visible. (For face detection, consider using tools like [Cloudinary API](https://cloudinary.com/documentation/face_detection_based_transformations?ref=blog.tryleap.ai)).

[![Avoid multiple faces](/public/multiple_faces.png)](https://blog.tryleap.ai/create-an-ai-headshot-generator-fine-tune-stable-diffusion-with-leap-api/#how-to-avoid-multiple-faces-in-results-%E2%9D%8C)

If you get distorted results with multiple faces, repeated subjects, multiple limbs, etc, make sure to follow these steps and minimize the chance of this happening:

- Make sure any samples uploaded are the same 1:1 height / width aspect ratio, for example 512x512, 1024x1024, etc.
- Avoid multiple people in the samples uploaded.
- Add "double torso, totem pole" to the negative prompt when generating.
- Make sure your dimensions when generating are also 1:1 with the same height / width ratios of the samples.

For more information on how to improve quality, read the blog [here](https://blog.tryleap.ai/create-an-ai-headshot-generator-fine-tune-stable-diffusion-with-leap-api/#step-1-gather-your-image-samples-%F0%9F%93%B8).

### All Thanks To Our Contributors:

<a href="https://github.com/leap-ai/headshots-starter/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=leap-ai/headshots-starter" />
</a>

## Additional Use-Cases

Headshot AI can be easily adapted to support many other use-cases of [Astria](https://www.astria.ai/) including:

- AI Avatars
  - [Anime](https://blog.tryleap.ai/transforming-images-into-anime-with-leap-ai/)
  - [Portraits](https://blog.tryleap.ai/ai-time-machine-images-a-glimpse-into-the-future-with-leap-ai/)
  - [Story Illustrations](https://blog.tryleap.ai/novel-ai-image-generator-using-leap-ai-a-comprehensive-guide/)

[![Anime AI Demo](/public/anime.png)](https://www.astria.ai/gallery/packs)

- Pet Portraits

[![Pet AI Demo](/public/pet.png)](https://www.astria.ai/gallery/packs)

- Product Shots
- Food Photography

[![Product AI Demo](/public/products.png)](https://www.astria.ai/)

- Icons
- [Style-Consistent Assets](https://blog.tryleap.ai/how-to-generate-style-consistent-assets-finetuning-on-leap/)

[![Icons AI Demo](/public/icons.png)](https://www.astria.ai/)

& more!

## Contributing

We welcome collaboration and appreciate your contribution to Headshot AI. If you have suggestions for improvement or significant changes in mind, feel free to open an issue!

If you want to contribute to the codebase make sure you create a new branch and open a pull request that points to `dev`.

## Resources and Support

- Help Email: support@astria.ai

## License

Headshot AI is released under the [MIT License](https://choosealicense.com/licenses/mit/).
