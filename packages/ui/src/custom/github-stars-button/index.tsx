import { GitHubStarsButtonClient } from './button.client';

// // Server component for data fetching
// const getGitHubStars = cache(async (repo: string) => {
//   try {
//     const response = await fetch(`https://api.github.com/repos/${repo}`, {
//       headers: {
//         Accept: 'application/vnd.github.v3+json',
//       },
//       cache: 'force-cache',
//     });

//     if (!response.ok) {
//       throw new Error(`GitHub API error: ${response.status}`);
//     }

//     const data = await response.json();
//     return data.stargazers_count;
//   } catch (error) {
//     console.error('Error fetching GitHub stars:', error);
//     return 0; // Return 0 as fallback
//   }
// });

// Server component
export function GitHubStarsButton({
  repo,
  className,
}: {
  repo: string;
  className?: string;
}) {
  // const stars = (await getGitHubStars(repo)) ?? 0;
  const stars = 0;

  // if (stars <= 1000) {
  //   return null;
  // }

  return (
    <GitHubStarsButtonClient className={className} repo={repo} stars={stars} />
  );
}
