# Bengaluru Maps

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## About the Project

Bengaluru Maps is a community-driven project to aggregate cool places in Bengaluru (Bangalore). Discover and share the best spots in the city - from cafes and restaurants to entertainment venues.

### Features

- **Create Maps**: Users can create custom maps of their favorite places in Bengaluru, complete with detailed descriptions using Markdown.
- **Add Locations**: Anyone can contribute by submitting new locations to existing maps.
- **Review System**: Map owners have full control over their maps and can review and approve or reject location submissions.
- **Google Maps Integration**: All locations are displayed on an interactive map, making it easy to visualize and explore the city.
- **User Authentication**: Simple and secure sign-in with Google to create maps and contribute locations.
- **Email Notifications**: Map owners receive email notifications when new locations are submitted to their maps.
- **Upvoting**: Users can upvote their favorite locations on a map.

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

See `.env.example` for more details.

## Database Setup

This project uses Supabase as the database. To set up the database:

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Run the migrations in the `supabase/migrations` folder. The easiest way to do this is with the Supabase CLI:
```bash
supabase db push
```
This will run all the migration files in the correct order.

Alternatively, you can run the migrations manually in the Supabase SQL Editor in the following order:
- `20251127151321_add_city_columns.sql`
- `20251127152500_update_rpc_functions_city.sql`
- `20251127160000_add_location_votes.sql`
- `20251127170000_add_location_votes_rls.sql`


## Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/)
- **Authentication**: [Supabase Auth](https://supabase.com/auth)
- **Database**: [Supabase](https://supabase.com/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) with [shadcn/ui](https://ui.shadcn.com/)
- **Maps**: [Google Maps API](https://developers.google.com/maps)
- **Forms**: [React Hook Form](https://react-hook-form.com/) with [Zod](https://github.com/colinhacks/zod)
- **Markdown**: [React Markdown](https://github.com/remarkjs/react-markdown) and [MDXEditor](https://mdxeditor.dev/)
- **Server-Only**: [server-only](https://www.npmjs.com/package/server-only)
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

## Deployment

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

For other platforms, you will need to configure your environment variables and build the project using `npm run build`.

## Contributing

Contributions are welcome! Here's how you can help:

1. Fork the repository
2. Create a new branch (`git checkout -b feature/your-feature`)
3. Make your changes
4. Commit your changes (`git commit -m 'feat: add some feature'`)
5. Push to the branch (`git push origin feature/your-feature`)
6. Open a Pull Request

Please ensure your code follows the existing style and passes all checks.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Contact

Created by [Sudarshan S](https://x.com/realsudarshansk).
