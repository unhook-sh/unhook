# @unhook/cli

## 0.14.9

### Patch Changes

**Added**
- Support for non-interactive CLI mode with flags `--non-interactive` and `--api-key`
- Ability to authenticate using API keys in CLI, including support for `UNHOOK_API_KEY` environment variable
- Auto-detection of non-interactive mode in CI environments

**Changed**
- Updated login and initialization flows to handle both interactive and non-interactive authentication scenarios
- Improved CLI authentication process to support multiple methods (OAuth, API key, auth code)

**Improved**
- Enhanced error handling during CLI authentication
- Better support for automated and scripted workflows by enabling non-interactive configuration
- More flexible authentication mechanisms for different usage scenarios

**Fixed**
- Potential authentication edge cases in non-interactive environments
- Improved error messaging for authentication failures

### Commits

- [`b3dacc9`](https://github.com/unhook-sh/unhook/commit/b3dacc99e5a843df30fbb7697c9e37655a4c4ab8) - chore: update CLI auth flow, release scripts, and documentation (Chris Watts)
- [`bc53b3c`](https://github.com/unhook-sh/unhook/commit/bc53b3c77db09ebb674b887e0b4e6b96a2167382) - chore: update webhook components and chart improvements (Chris Watts)

## 0.14.8

### Patch Changes

**Fixed**
- Restored workspace dependency for `@unhook/client`, ensuring the latest development version of the package is used during local development and builds

## 0.14.5

### Patch Changes

**Changed**
- Updated dependencies for Clerk, React, Posthog, Zod, and other core libraries to their latest versions
- Upgraded core package versions to improve compatibility and security

**Improved**
- Enhanced library versions should provide better performance, security, and potential new features across the CLI's dependencies

## 0.14.4

### Patch Changes

- [`5a962e3`](https://github.com/unhook-sh/unhook/commit/5a962e30444c13b7feb28842f776942adbd6b5c9) Thanks [@seawatts](https://github.com/seawatts)! - Updates

- Updated dependencies [[`5a962e3`](https://github.com/unhook-sh/unhook/commit/5a962e30444c13b7feb28842f776942adbd6b5c9)]:
  - @unhook/client@0.6.4

## 0.14.3

### Patch Changes

- [`e3d46c0`](https://github.com/unhook-sh/unhook/commit/e3d46c0d1d731f0486d87b21de6a0b4e62d59b3f) Thanks [@seawatts](https://github.com/seawatts)! - Publish

- [`a197dc4`](https://github.com/unhook-sh/unhook/commit/a197dc4cb3e897abc8f149a06fd23e20608bc2d2) Thanks [@seawatts](https://github.com/seawatts)! - Updates

- Updated dependencies [[`e3d46c0`](https://github.com/unhook-sh/unhook/commit/e3d46c0d1d731f0486d87b21de6a0b4e62d59b3f), [`a197dc4`](https://github.com/unhook-sh/unhook/commit/a197dc4cb3e897abc8f149a06fd23e20608bc2d2)]:
  - @unhook/client@0.6.3

## 0.14.2

### Patch Changes

- [`43268bf`](https://github.com/unhook-sh/unhook/commit/43268bf0f0a811ef91344153ba83f30251ff0c67) Thanks [@seawatts](https://github.com/seawatts)! - Update things

- Updated dependencies [[`43268bf`](https://github.com/unhook-sh/unhook/commit/43268bf0f0a811ef91344153ba83f30251ff0c67)]:
  - @unhook/client@0.6.2

## 0.14.1

### Patch Changes

- Updated dependencies [[`23769c8`](https://github.com/unhook-sh/unhook/commit/23769c8a919e65afd7908123abacfa2648a0f5a6)]:
  - @unhook/client@0.6.1

## 0.14.0

### Minor Changes

- [`a8b6b5b`](https://github.com/unhook-sh/unhook/commit/a8b6b5bd4fd6660f49dbbc2999003f76b0acc51b) Thanks [@seawatts](https://github.com/seawatts)! - Change webhookId to webhookUrl

### Patch Changes

- Updated dependencies [[`a8b6b5b`](https://github.com/unhook-sh/unhook/commit/a8b6b5bd4fd6660f49dbbc2999003f76b0acc51b)]:
  - @unhook/client@0.6.0

## 0.13.25

### Patch Changes

- Updated dependencies [[`e524984`](https://github.com/unhook-sh/unhook/commit/e524984072f5a6af4d721f23be29e207b3cd4714)]:
  - @unhook/client@0.5.25

## 0.13.24

### Patch Changes

- Updated dependencies [[`756ca33`](https://github.com/unhook-sh/unhook/commit/756ca339bc771e780e0b7d67dbf29979c5b21f22)]:
  - @unhook/client@0.5.24

## 0.13.23

### Patch Changes

- [`d132950`](https://github.com/unhook-sh/unhook/commit/d132950f911a2eee192cda7795a9017c265cd429) Thanks [@seawatts](https://github.com/seawatts)! - Update webpanel for viewing events

- Updated dependencies [[`d132950`](https://github.com/unhook-sh/unhook/commit/d132950f911a2eee192cda7795a9017c265cd429)]:
  - @unhook/client@0.5.23

## 0.13.22

### Patch Changes

- [`446bf49`](https://github.com/unhook-sh/unhook/commit/446bf49b12b724791b88544e2e6f38a37feb9704) Thanks [@seawatts](https://github.com/seawatts)! - Fix build

- Updated dependencies [[`446bf49`](https://github.com/unhook-sh/unhook/commit/446bf49b12b724791b88544e2e6f38a37feb9704)]:
  - @unhook/client@0.5.22

## 0.13.21

### Patch Changes

- [`fd746be`](https://github.com/unhook-sh/unhook/commit/fd746be9b43f5a6592481024e1d6eb09dc39dc02) Thanks [@seawatts](https://github.com/seawatts)! - Switch to polling instead of realtime

- Updated dependencies [[`fd746be`](https://github.com/unhook-sh/unhook/commit/fd746be9b43f5a6592481024e1d6eb09dc39dc02)]:
  - @unhook/client@0.5.21

## 0.13.20

### Patch Changes

- Updated dependencies [[`c7c9c18`](https://github.com/unhook-sh/unhook/commit/c7c9c18408deae56af6e988d6891a904c26b1bca)]:
  - @unhook/client@0.5.20

## 0.13.19

### Patch Changes

- [`741da3a`](https://github.com/unhook-sh/unhook/commit/741da3a2b15d3703f90522b80d9567c87f17eca8) Thanks [@seawatts](https://github.com/seawatts)! - Fix vscode subscription

- Updated dependencies [[`741da3a`](https://github.com/unhook-sh/unhook/commit/741da3a2b15d3703f90522b80d9567c87f17eca8)]:
  - @unhook/client@0.5.19

## 0.13.18

### Patch Changes

- [`3fefb72`](https://github.com/unhook-sh/unhook/commit/3fefb72d53176ffba9585e90ef6f31e5910a6c3b) Thanks [@seawatts](https://github.com/seawatts)! - Fix issue with onboarding config

- Updated dependencies [[`3fefb72`](https://github.com/unhook-sh/unhook/commit/3fefb72d53176ffba9585e90ef6f31e5910a6c3b)]:
  - @unhook/client@0.5.18

## 0.13.17

### Patch Changes

- [`d3ba1f1`](https://github.com/unhook-sh/unhook/commit/d3ba1f185ed7533e72b2c68f645a5d8b6b8115fc) Thanks [@seawatts](https://github.com/seawatts)! - Add sign in notification on vscode

- Updated dependencies [[`d3ba1f1`](https://github.com/unhook-sh/unhook/commit/d3ba1f185ed7533e72b2c68f645a5d8b6b8115fc)]:
  - @unhook/client@0.5.17

## 0.13.16

### Patch Changes

- [`c7c29d9`](https://github.com/unhook-sh/unhook/commit/c7c29d9f0c77a57c0e0ae2bd080bda6f578239d1) Thanks [@seawatts](https://github.com/seawatts)! - Fix issue with vscode delivery

- Updated dependencies [[`c7c29d9`](https://github.com/unhook-sh/unhook/commit/c7c29d9f0c77a57c0e0ae2bd080bda6f578239d1)]:
  - @unhook/client@0.5.16

## 0.13.15

### Patch Changes

- [`2809a8b`](https://github.com/unhook-sh/unhook/commit/2809a8b368c4a5a16354096bcb3f278c002eaccb) Thanks [@seawatts](https://github.com/seawatts)! - Fix up onboarding

- Updated dependencies [[`2809a8b`](https://github.com/unhook-sh/unhook/commit/2809a8b368c4a5a16354096bcb3f278c002eaccb)]:
  - @unhook/client@0.5.15

## 0.13.14

### Patch Changes

- [`50dfa73`](https://github.com/unhook-sh/unhook/commit/50dfa739d8a81d1ce42399e2fc701924241bbc77) Thanks [@seawatts](https://github.com/seawatts)! - Fix issue with building stripe

- Updated dependencies [[`50dfa73`](https://github.com/unhook-sh/unhook/commit/50dfa739d8a81d1ce42399e2fc701924241bbc77)]:
  - @unhook/client@0.5.14

## 0.13.13

### Patch Changes

- [`7e9d2ca`](https://github.com/unhook-sh/unhook/commit/7e9d2caf18ce8976e17f669d938e139b8544b42c) Thanks [@seawatts](https://github.com/seawatts)! - Fix build

- Updated dependencies [[`7e9d2ca`](https://github.com/unhook-sh/unhook/commit/7e9d2caf18ce8976e17f669d938e139b8544b42c)]:
  - @unhook/client@0.5.13

## 0.13.12

### Patch Changes

- [`b03408f`](https://github.com/unhook-sh/unhook/commit/b03408f042781953b4ae4fccdba57c091dbc907e) Thanks [@seawatts](https://github.com/seawatts)! - Fix issue with vscode onboarding

- Updated dependencies [[`b03408f`](https://github.com/unhook-sh/unhook/commit/b03408f042781953b4ae4fccdba57c091dbc907e)]:
  - @unhook/client@0.5.12

## 0.13.11

### Patch Changes

- [`0cf3d2a`](https://github.com/unhook-sh/unhook/commit/0cf3d2a4bada3538ea33ae15bff26920b6666368) Thanks [@seawatts](https://github.com/seawatts)! - Add new database tables

- Updated dependencies [[`0cf3d2a`](https://github.com/unhook-sh/unhook/commit/0cf3d2a4bada3538ea33ae15bff26920b6666368)]:
  - @unhook/client@0.5.11

## 0.13.10

### Patch Changes

- [`bfb3a6c`](https://github.com/unhook-sh/unhook/commit/bfb3a6c2d0bf09e6c5f096727ac1459ac286b8ff) Thanks [@seawatts](https://github.com/seawatts)! - Fix issues with init

- Updated dependencies [[`bfb3a6c`](https://github.com/unhook-sh/unhook/commit/bfb3a6c2d0bf09e6c5f096727ac1459ac286b8ff)]:
  - @unhook/client@0.5.10

## 0.13.9

### Patch Changes

- [`ae8f7e9`](https://github.com/unhook-sh/unhook/commit/ae8f7e905e0a5ecdde1f9c4173c85f9f57cb40e5) Thanks [@seawatts](https://github.com/seawatts)! - Fix issue with isDevelopment and NODE_ENV

- Updated dependencies [[`ae8f7e9`](https://github.com/unhook-sh/unhook/commit/ae8f7e905e0a5ecdde1f9c4173c85f9f57cb40e5)]:
  - @unhook/client@0.5.9

## 0.13.8

### Patch Changes

- [`c47d49a`](https://github.com/unhook-sh/unhook/commit/c47d49a1058b2172a231d9d1e82a5caffce4846a) Thanks [@seawatts](https://github.com/seawatts)! - Fix build

- Updated dependencies [[`c47d49a`](https://github.com/unhook-sh/unhook/commit/c47d49a1058b2172a231d9d1e82a5caffce4846a)]:
  - @unhook/client@0.5.8

## 0.13.7

### Patch Changes

- [`226b907`](https://github.com/unhook-sh/unhook/commit/226b907103d45817cd0a11a6c5e671ad930c95bd) Thanks [@seawatts](https://github.com/seawatts)! - Fix issue with catalog and client

- Updated dependencies [[`226b907`](https://github.com/unhook-sh/unhook/commit/226b907103d45817cd0a11a6c5e671ad930c95bd)]:
  - @unhook/client@0.5.7

## 0.13.6

### Patch Changes

- [`3915e59`](https://github.com/unhook-sh/unhook/commit/3915e59b88628eb99b22b8d92bd01555ac1338a2) Thanks [@seawatts](https://github.com/seawatts)! - Fix issue with build

## 0.13.5

### Patch Changes

- [`a8a3cc2`](https://github.com/unhook-sh/unhook/commit/a8a3cc2812fa94005f43452d712a7554fcaf3b47) Thanks [@seawatts](https://github.com/seawatts)! - Fix issue with login

## 0.13.4

### Patch Changes

- [`c0adefa`](https://github.com/unhook-sh/unhook/commit/c0adefa691a4f8211633bb1d321452df96ab1aea) Thanks [@seawatts](https://github.com/seawatts)! - Fix issue with vscode login

- Updated dependencies [[`c0adefa`](https://github.com/unhook-sh/unhook/commit/c0adefa691a4f8211633bb1d321452df96ab1aea)]:
  - @unhook/client@0.5.4

## 0.13.3

### Patch Changes

- [`fc2c1cd`](https://github.com/unhook-sh/unhook/commit/fc2c1cdd9354974bb1e2c70df70bf1f11bd15832) Thanks [@seawatts](https://github.com/seawatts)! - Fix build issue

- Updated dependencies [[`fc2c1cd`](https://github.com/unhook-sh/unhook/commit/fc2c1cdd9354974bb1e2c70df70bf1f11bd15832)]:
  - @unhook/client@0.5.3

## 0.13.2

### Patch Changes

- [`a6bf4e3`](https://github.com/unhook-sh/unhook/commit/a6bf4e30a7d8f51c37c2e0d1843f2eb6e7129f4f) Thanks [@seawatts](https://github.com/seawatts)! - Fix build

- Updated dependencies [[`a6bf4e3`](https://github.com/unhook-sh/unhook/commit/a6bf4e30a7d8f51c37c2e0d1843f2eb6e7129f4f)]:
  - @unhook/client@0.5.2

## 0.13.1

### Patch Changes

- [`9d4b4f7`](https://github.com/unhook-sh/unhook/commit/9d4b4f7036c36be5f18df9fa749d597480909f00) Thanks [@seawatts](https://github.com/seawatts)! - Fix issue with request body

- Updated dependencies [[`9d4b4f7`](https://github.com/unhook-sh/unhook/commit/9d4b4f7036c36be5f18df9fa749d597480909f00)]:
  - @unhook/client@0.5.1

## 0.13.0

### Minor Changes

- [`bcc0682`](https://github.com/unhook-sh/unhook/commit/bcc068200f849bc7555bda1b7f1ce753ed167787) Thanks [@seawatts](https://github.com/seawatts)! - Working

### Patch Changes

- Updated dependencies [[`bcc0682`](https://github.com/unhook-sh/unhook/commit/bcc068200f849bc7555bda1b7f1ce753ed167787)]:
  - @unhook/client@0.5.0

## 0.12.21

### Patch Changes

- [`b20456e`](https://github.com/unhook-sh/unhook/commit/b20456eddb63af683e5635597b921718667c10f5) Thanks [@seawatts](https://github.com/seawatts)! - Build working

## 0.12.17

### Patch Changes

- [`5752d0c`](https://github.com/unhook-sh/unhook/commit/5752d0c9ee5181eea5224d4875d471a0c23965f5) Thanks [@seawatts](https://github.com/seawatts)! - Test

## 0.12.16

### Patch Changes

- [`8b3bad3`](https://github.com/unhook-sh/unhook/commit/8b3bad37c71957494c8dcf933f4c0996e71adc0e) Thanks [@seawatts](https://github.com/seawatts)! - Update

## 0.12.15

### Patch Changes

- [`f2a003e`](https://github.com/unhook-sh/unhook/commit/f2a003e3291ad4300c5d97316a030a6ab4c29468) Thanks [@seawatts](https://github.com/seawatts)! - Fix keytar

## 0.12.14

### Patch Changes

- [`f0463b5`](https://github.com/unhook-sh/unhook/commit/f0463b55ff5b8144dae426934f8a364a33ae892d) Thanks [@seawatts](https://github.com/seawatts)! - Prepare publish

## 0.12.13

### Patch Changes

- [`2031c1b`](https://github.com/unhook-sh/unhook/commit/2031c1b6fe97d1c0fba844371feca760c55f6e53) Thanks [@seawatts](https://github.com/seawatts)! - Test

- Updated dependencies [[`2031c1b`](https://github.com/unhook-sh/unhook/commit/2031c1b6fe97d1c0fba844371feca760c55f6e53)]:
  - @unhook/client@0.4.6

## 0.12.12

### Patch Changes

- [`7a73526`](https://github.com/unhook-sh/unhook/commit/7a73526720fdb2fec1b672a6d513bc5d66820439) Thanks [@seawatts](https://github.com/seawatts)! - Move away from bun --compile

- Updated dependencies [[`7a73526`](https://github.com/unhook-sh/unhook/commit/7a73526720fdb2fec1b672a6d513bc5d66820439)]:
  - @unhook/client@0.4.5

## 0.12.11

### Patch Changes

- [`ef829e8`](https://github.com/unhook-sh/unhook/commit/ef829e8a99ead4472679af1aa841918d5fc722ac) Thanks [@seawatts](https://github.com/seawatts)! - test

## 0.12.10

### Patch Changes

- [`70d2ed0`](https://github.com/unhook-sh/unhook/commit/70d2ed0c214555517ddd1fe144b26cdf2d3e5953) Thanks [@seawatts](https://github.com/seawatts)! - Testing

## 0.12.9

### Patch Changes

- [`954edef`](https://github.com/unhook-sh/unhook/commit/954edef048cda371347d53d03630f9c175b2308d) Thanks [@seawatts](https://github.com/seawatts)! - Bump

- Updated dependencies [[`954edef`](https://github.com/unhook-sh/unhook/commit/954edef048cda371347d53d03630f9c175b2308d)]:
  - @unhook/client@0.4.4

## 0.12.7

### Patch Changes

- [`8fc2c00`](https://github.com/unhook-sh/unhook/commit/8fc2c001e56b3c358cf321968bcdec1e6083c328) Thanks [@seawatts](https://github.com/seawatts)! - Bump

## 0.12.6

### Patch Changes

- [`2e1c1b3`](https://github.com/unhook-sh/unhook/commit/2e1c1b3c5d408f354f9484722e8991b9f3477d58) Thanks [@seawatts](https://github.com/seawatts)! - Bump

## 0.12.4

### Patch Changes

- [`f23a5e2`](https://github.com/unhook-sh/unhook/commit/f23a5e2ffcf6b3646b0ba0073fde1a7e3469ea89) Thanks [@seawatts](https://github.com/seawatts)! - Release

## 0.12.3

### Patch Changes

- [`48723b7`](https://github.com/unhook-sh/unhook/commit/48723b7dbebd91dac4246028887d67c752525be7) Thanks [@seawatts](https://github.com/seawatts)! - Fix release

- Updated dependencies [[`48723b7`](https://github.com/unhook-sh/unhook/commit/48723b7dbebd91dac4246028887d67c752525be7)]:
  - @unhook/client@0.4.3

## 0.12.2

### Patch Changes

- [`7d89281`](https://github.com/unhook-sh/unhook/commit/7d89281d695e7c713ac567eefde612ed505c7f44) Thanks [@seawatts](https://github.com/seawatts)! - Fix github release

## 0.12.1

### Patch Changes

- [`9ec655d`](https://github.com/unhook-sh/unhook/commit/9ec655dd64489e642922c69d7624d2673caa21b9) Thanks [@seawatts](https://github.com/seawatts)! - Fix issue with publishing

- Updated dependencies [[`9ec655d`](https://github.com/unhook-sh/unhook/commit/9ec655dd64489e642922c69d7624d2673caa21b9)]:
  - @unhook/client@0.4.2

## 0.12.0

### Minor Changes

- [`0af4147`](https://github.com/unhook-sh/unhook/commit/0af41479013d7162636bd36e567b2be2173c76ad) Thanks [@seawatts](https://github.com/seawatts)! - Release vscode

## 0.11.0

### Minor Changes

- [`4796eef`](https://github.com/unhook-sh/unhook/commit/4796eef5636c5e0dfaaf05d7a29db277fee84148) Thanks [@seawatts](https://github.com/seawatts)! - Add cross platform support

## 0.10.0

### Minor Changes

- [`cbb97c0`](https://github.com/unhook-sh/unhook/commit/cbb97c078ced78e4a37c98bd7b0524822984b163) Thanks [@seawatts](https://github.com/seawatts)! - Fix cli table widths

### Patch Changes

- Updated dependencies [[`cbb97c0`](https://github.com/unhook-sh/unhook/commit/cbb97c078ced78e4a37c98bd7b0524822984b163)]:
  - @unhook/client@0.4.1

## 0.9.0

### Minor Changes

- [`5cc5c2d`](https://github.com/unhook-sh/unhook/commit/5cc5c2d2ca6b5981cba7009d977e96230666bb48) Thanks [@seawatts](https://github.com/seawatts)! - Fix cross platform install

## 0.8.0

### Minor Changes

- [`bb8ef63`](https://github.com/unhook-sh/unhook/commit/bb8ef6322063190b66cf08987a7cecc971001bc3) Thanks [@seawatts](https://github.com/seawatts)! - Fixed realtime events and requests handling

### Patch Changes

- Updated dependencies [[`bb8ef63`](https://github.com/unhook-sh/unhook/commit/bb8ef6322063190b66cf08987a7cecc971001bc3)]:
  - @unhook/client@0.4.0

## 0.7.0

### Minor Changes

- [`7be13e1`](https://github.com/unhook-sh/unhook/commit/7be13e1ee39c63f7504f993fbafa245bead1f125) Thanks [@seawatts](https://github.com/seawatts)! - Rename deliver to delivery

### Patch Changes

- Updated dependencies [[`7be13e1`](https://github.com/unhook-sh/unhook/commit/7be13e1ee39c63f7504f993fbafa245bead1f125)]:
  - @unhook/client@0.3.0

## 0.6.1

### Patch Changes

- [`e0da95c`](https://github.com/unhook-sh/unhook/commit/e0da95c315eb7578ad2f6ef2b118337ff128b466) Thanks [@seawatts](https://github.com/seawatts)! - Fix binary

## 0.6.0

### Minor Changes

- [`a043255`](https://github.com/unhook-sh/unhook/commit/a04325591929094e040b0562036ade007c0499b8) Thanks [@seawatts](https://github.com/seawatts)! - Rename To and From to Source and Destination

## 0.5.0

### Minor Changes

- [`9432f0c`](https://github.com/unhook-sh/unhook/commit/9432f0c9736bba9c68d9cc44cce27c5d81d7df2b) Thanks [@seawatts](https://github.com/seawatts)! - New Onboarding Flow

## 0.4.2

### Patch Changes

- [`a04c603`](https://github.com/unhook-sh/unhook/commit/a04c603bd885d4403ca9db0c535f0b9544e15d4a) Thanks [@seawatts](https://github.com/seawatts)! - Fix issue with cli release

## 0.4.1

### Patch Changes

- [`e2350f2`](https://github.com/unhook-sh/unhook/commit/e2350f21ab80485061446a3d22c0634389722210) Thanks [@seawatts](https://github.com/seawatts)! - Fix issue with cli release

## 0.4.0

### Minor Changes

- [`9caf03d`](https://github.com/unhook-sh/unhook/commit/9caf03d5b8dab9b9118ed8aa0720cad43c54ce80) Thanks [@seawatts](https://github.com/seawatts)! - Initial Beta Release

  This release marks the first beta version of Unhook, featuring:
  - CLI tool for managing webhooks
  - API endpoints for webhook management
  - Database integration for persistent storage
  - Authentication and user management
  - Logging system for debugging
  - Webhook handling and processing

## 0.3.0

### Minor Changes

- Committing changelog
