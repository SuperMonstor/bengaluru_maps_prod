# Bengaluru Maps

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## About the Project

Bengaluru Maps is a community-driven project to aggregate cool places in Bengaluru (Bangalore). Discover and share the best spots in the city - from cafes and restaurants to entertainment venues.

### Key Features

- **Create Maps**: Create themed maps with detailed descriptions using Markdown
- **Add Locations**: Submit and contribute locations to existing maps
- **Review System**: Map owners can review and approve location submissions
- **Google Maps Integration**: View all locations on an interactive map
- **User Authentication**: Sign in with Google to create and contribute to maps

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
NEXT_PUBLIC_SITE_URL=your_site_url_for_production
```

## Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org/)
- **Authentication**: [Supabase Auth](https://supabase.com/auth)
- **Database**: [Supabase](https://supabase.com/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) with [shadcn/ui](https://ui.shadcn.com/)
- **Maps**: [Google Maps API](https://developers.google.com/maps)
- **Forms**: [React Hook Form](https://react-hook-form.com/) with [Zod](https://github.com/colinhacks/zod)
- **Markdown**: [React Markdown](https://github.com/remarkjs/react-markdown) and [MDXEditor](https://mdxeditor.dev/)
- **Fonts**: [Geist](https://vercel.com/font) from Vercel

## Project Structure

- `/app`: Next.js App Router pages and layouts
- `/components`: Reusable UI components
- `/lib`: Utility functions, hooks, and Supabase client
  - `/context`: React context providers
  - `/hooks`: Custom React hooks
  - `/supabase`: Supabase client and database functions
  - `/utils`: Helper functions
  - `/validations`: Zod validation schemas
- `/public`: Static assets

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Created By

This project was created by [Sudarshan S](https://x.com/realsudarshansk).
