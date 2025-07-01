# Unhook Marketing Slash Commands

Welcome to your comprehensive social media marketing toolkit for Unhook! These Claude Code slash commands provide full agentic loops for creating and publishing viral content across all major platforms.

## 🚀 Quick Start

To use any command in Claude Code, simply type `/project:` followed by the command name:

```
/project:twitter-viral
```

Commands with parameters can be used like this:
```
/project:marketing-coordinator Launch our new webhook debugging feature
```

## 📋 Available Commands

All commands are located in `.claude/commands/` and are available as `/project:command-name`.

### Platform-Specific Commands

#### `/project:twitter-viral`
Generate viral Twitter/X content including:
- 5 different viral tweet options with hooks
- Engagement strategies and timing
- Visual content suggestions
- Thread ideas and content calendars
- Influencer engagement tactics

#### `/project:linkedin-thought-leader`
Create LinkedIn thought leadership content:
- Professional posts with compelling hooks
- Article outlines on webhook development
- Case studies showcasing ROI
- Team spotlights and culture posts
- Industry insights and trends

#### `/project:reddit-community`
Authentic Reddit community engagement:
- Subreddit-specific content strategies
- Comment templates for organic promotion
- Post ideas for different communities
- Timing and karma optimization
- Community relationship building

#### `/project:youtube-tutorial`
Video content planning and scripts:
- Tutorial scripts with timestamps
- Thumbnail design suggestions
- SEO-optimized titles and descriptions
- Series planning for sustained engagement
- Collaboration opportunities

#### `/project:devto-blog`
Technical blog content strategy:
- In-depth technical articles
- Tutorial series planning
- Code examples and demos
- SEO optimization strategies
- Cross-promotion tactics

#### `/project:hackernews-launch`
Hacker News launch strategy:
- Show HN post variations
- Comment engagement strategies
- Timing optimization
- Community value alignment
- Follow-up strategies

#### `/project:producthunt-launch`
Product Hunt launch orchestration:
- Launch day timeline
- Asset preparation checklists
- Hunter outreach templates
- Community engagement tactics
- Post-launch momentum strategies

#### `/project:tiktok-devtok`
TikTok/DevTok viral content:
- Trend-based video concepts
- Hook optimization
- Educational content ideas
- Collaboration opportunities
- Hashtag strategies

#### `/project:discord-community`
Discord community engagement:
- Server-specific strategies
- Bot integration ideas
- Community event planning
- Engagement tactics
- Value-first approaches

### 🎯 Master Coordinator

#### `/project:marketing-coordinator`
The master marketing coordinator that can:
- Orchestrate multi-platform campaigns
- Analyze campaign requests
- Generate platform-specific content
- Track performance metrics
- Suggest optimization strategies

**Usage with parameters:**
```
/project:marketing-coordinator Create a campaign for our new OAuth integration feature
```

## 💡 Pro Tips

### 1. Campaign Planning
Start with the marketing coordinator to plan comprehensive campaigns:
```
/project:marketing-coordinator Plan a 2-week campaign for our enterprise launch
```

### 2. Platform Optimization
Each platform command is optimized for that specific platform's culture and best practices. Use them individually for focused content:
```
/project:twitter-viral
/project:linkedin-thought-leader
```

### 3. Content Repurposing
Use multiple commands to repurpose content across platforms:
1. Start with `/project:devto-blog` for technical content
2. Use `/project:twitter-viral` to create tweet threads from the blog
3. Use `/project:linkedin-thought-leader` to create professional insights
4. Use `/project:youtube-tutorial` to plan video versions

### 4. Launch Sequences
For product launches, use commands in sequence:
1. `/project:marketing-coordinator` - Overall strategy
2. `/project:producthunt-launch` - PH specific prep
3. `/project:hackernews-launch` - HN strategy
4. `/project:twitter-viral` - Launch day tweets
5. `/project:reddit-community` - Community engagement

### 5. A/B Testing
Generate multiple variations for testing:
```
/project:twitter-viral
```
Then ask: "Generate 3 more variations with different hooks"

## 🔧 Customization

### Adding Custom Parameters
Commands support the `$ARGUMENTS` placeholder. For example, the marketing coordinator uses:
```
Analyze this marketing request: $ARGUMENTS
```

### Creating New Commands
Add new markdown files to `.claude/commands/`:
```bash
echo "Your prompt here" > .claude/commands/instagram-reels.md
```

### Team Collaboration
These commands are version controlled and shared with your team. Any team member with access to the repo can use them.

## 📊 Performance Tracking

After generating content with any command, you can ask Claude to:
- Create tracking spreadsheets
- Set up UTM parameters
- Generate analytics dashboards
- Create performance reports

## 🚨 Important Notes

1. **Review Generated Content**: Always review and customize generated content before publishing
2. **Platform Guidelines**: Ensure content follows each platform's guidelines
3. **Timing Matters**: Use platform-specific timing recommendations
4. **Authenticity First**: Maintain your brand voice across all content
5. **Iterate and Improve**: Use performance data to refine your approach

## 🎉 Getting Started

1. Open Claude Code in your terminal
2. Type `/project:marketing-coordinator` to start with overall strategy
3. Use platform-specific commands for detailed content
4. Iterate based on performance

Remember: These commands are designed to accelerate your marketing efforts, not replace human creativity and strategic thinking. Use them as a powerful starting point and customize for your specific needs.

Happy marketing! 🚀