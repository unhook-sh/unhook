# @unhook/stripe

Type-safe Stripe integration for Unhook.

## Billing Types Generation

This package uses a template-based approach to generate type-safe Stripe billing types. This ensures that sensitive Stripe IDs are not committed to the repository while maintaining type safety.

### How it works

1. **Template File**: `src/guards/billing-types.template.ts` contains the structure and lookup keys but with placeholder IDs
2. **Generation Script**: `scripts/generate-billing-types.ts` imports the lookup keys from the template and fetches actual Stripe IDs
3. **Generated File**: `src/guards/billing-types.generated.ts` is generated with real IDs and excluded from git

**Single Source of Truth**: All lookup keys are defined only in the template file and imported by the generation script, eliminating duplication.

### Usage

#### Development Setup

1. Run the Stripe entities creation script first:
   ```bash
   bun run create-stripe-entities
   ```

2. Generate the billing types:
   ```bash
   bun run generate-billing-types
   ```

#### Build Process

The billing types should be generated as part of your build process. Add this to your build scripts:

```json
{
  "scripts": {
    "prebuild": "bun run generate-billing-types",
    "build": "your-build-command"
  }
}
```

### File Structure

```
src/guards/
├── billing-types.template.ts      # Template with lookup keys (committed)
├── billing-types.generated.ts     # Generated with real IDs (ignored)
└── ...

scripts/
└── generate-billing-types.ts      # Generation script (committed)
```

### Security Benefits

- ✅ Lookup keys are safe to commit (they're just strings)
- ✅ Actual Stripe IDs are generated at build time
- ✅ No sensitive data in the repository
- ✅ Type safety is maintained
- ✅ Easy to update when Stripe entities change

### Adding New Billing Types

1. Update the template file with new lookup keys
2. Update the generation script if needed
3. Run the generation script to update the types

### Environment Variables

The generation script requires these environment variables:
- `STRIPE_SECRET_KEY`: Your Stripe secret key

Make sure these are set in your environment or use a tool like Infisical to manage them.