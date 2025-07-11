import fs from 'node:fs';
import path from 'node:path';
import rehypePrettyCode from 'rehype-pretty-code';
import rehypeStringify from 'rehype-stringify';
import remarkGfm from 'remark-gfm';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import { unified } from 'unified';
import { siteConfig } from './config';

export type Post = {
  title: string;
  publishedAt: string;
  summary: string;
  author: string;
  slug: string;
  image?: string;
};

function parseFrontmatter(fileContent: string) {
  const frontmatterRegex = /---\s*([\s\S]*?)\s*---/;
  const match = frontmatterRegex.exec(fileContent);
  const frontMatterBlock = match?.[1];
  const content = fileContent.replace(frontmatterRegex, '').trim();
  const frontMatterLines = frontMatterBlock?.trim().split('\n') ?? [];
  const metadata: Partial<Post> = {};

  for (const line of frontMatterLines) {
    const [key, ...valueArr] = line.split(': ');
    let value = valueArr.join(': ').trim();
    value = value.replace(/^['"](.*)['"]$/, '$1'); // Remove quotes
    metadata[key?.trim() as keyof Post] = value;
  }

  return { content, data: metadata as Post };
}

function getMDXFiles(dir: string) {
  return fs.readdirSync(dir).filter((file) => path.extname(file) === '.mdx');
}

export async function markdownToHTML(markdown: string) {
  const p = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype)
    .use(rehypePrettyCode, {
      keepBackground: false,
      // https://rehype-pretty.pages.dev/#usage
      theme: {
        dark: 'min-dark',
        light: 'min-light',
      },
    })
    .use(rehypeStringify)
    .process(markdown);

  return p.toString();
}

export async function getPost(slug: string) {
  const filePath = path.join('content', `${slug}.mdx`);
  const source = fs.readFileSync(filePath, 'utf-8');
  const { content: rawContent, data: metadata } = parseFrontmatter(source);
  const content = await markdownToHTML(rawContent);
  const defaultImage = `${siteConfig.url}/og?title=${encodeURIComponent(
    metadata.title,
  )}`;
  return {
    metadata: {
      ...metadata,
      image: metadata.image || defaultImage,
    },
    slug,
    source: content,
  };
}

async function getAllPosts(dir: string) {
  const mdxFiles = getMDXFiles(dir);
  return Promise.all(
    mdxFiles.map(async (file) => {
      const slug = path.basename(file, path.extname(file));
      const { metadata, source } = await getPost(slug);
      return {
        ...metadata,
        slug,
        source,
      };
    }),
  );
}

export async function getBlogPosts() {
  return getAllPosts(path.join(process.cwd(), 'content'));
}
