# Local Services Setup

## Running Services

All local services are managed via Docker Compose:

```bash
# Start all services
docker-compose up -d

# Stop all services
docker-compose down

# View logs
docker-compose logs -f

# Check status
docker ps --filter "name=quickcarousals"
```

## Service Details

### PostgreSQL (via Docker)
- **Host:** localhost
- **Port:** 5432
- **Database:** quickcarousals
- **Username:** quickcarousals
- **Password:** quickcarousals_dev_password
- **Connection String:** `postgresql://quickcarousals:quickcarousals_dev_password@localhost:5432/quickcarousals`

**Test Connection:**
```bash
docker exec -it quickcarousals-postgres psql -U quickcarousals -d quickcarousals
```

### Supabase (Local Development Stack)
- **API URL:** http://127.0.0.1:54321
- **Database URL:** postgresql://postgres:postgres@127.0.0.1:54325/postgres
- **Studio URL:** http://127.0.0.1:54323
- **Anon Key:** `sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH`
- **Service Role Key:** `sb_secret_N7UND0UgjKTVK-Uodkm0Hg_xSvEMPvz`
- **S3 Storage URL:** http://127.0.0.1:54321/storage/v1/s3
- **S3 Access Key:** `625729a08b95bf1b7ff351a663f3a23c`
- **S3 Secret Key:** `850181e4652dd023b7a98c58ae0d2d34bd487ee0cc3254aed6eda37307425907`

**Commands:**
```bash
# Start Supabase
supabase start

# Stop Supabase
supabase stop

# View Supabase Studio (GUI)
open http://127.0.0.1:54323

# Check status
supabase status
```

### Redis (Upstash Cloud)
- **REST URL:** https://hot-shark-43752.upstash.io
- **Using:** Upstash serverless Redis
- **Note:** No local Redis needed - using cloud service

**Test Connection:**
```bash
curl -H "Authorization: Bearer AaroAAIncDJkZGYzZjM2NDZhZjE0NzYwYjE0ZDI1MWU1ZDBmNWYxMHAyNDM3NTI" \
  https://hot-shark-43752.upstash.io/ping
```

### Stripe Webhook Listener
- **Webhook Secret:** `whsec_b0dd07836028567ab28be79288ef68efa6fb44a91226ac12f18a3c268338e140`
- **Running via:** `stripe listen --forward-to localhost:3000/api/webhooks/stripe`

## Environment Variables Set

✅ **PostgreSQL** - Local Docker (POSTGRES_URL)
✅ **Supabase** - Local Development Stack (NEXT_PUBLIC_SUPABASE_URL)
✅ **Redis** - Upstash Cloud (UPSTASH_REDIS_REST_URL)  
✅ **Clerk** - Real API keys
✅ **Stripe** - Real API keys  
✅ **GitHub OAuth** - Real API keys
✅ **Resend** - Real API key
✅ **OpenAI** - Real API key

## Not Yet Configured (Optional)

These services are optional and can be added later:

- ❌ **Cloudflare R2** - File storage for exports (Supabase S3 is available locally)
- ❌ **PostHog** - Analytics
- ❌ **Sentry** - Error tracking
