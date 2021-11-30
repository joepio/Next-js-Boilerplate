import fs from 'fs';
import path from 'path';

import matter from 'gray-matter';
import { MDXRemoteSerializeResult } from 'next-mdx-remote';
import { serialize } from 'next-mdx-remote/serialize';

const pageDirectory = path.join(process.cwd(), '/src/content');
const blogDirectory = path.join(process.cwd(), '/src/content/blog');

export async function getPostBySlug(
  slug: string,
  locale = 'en'
): Promise<BlogItemProp> {
  const realSlug = slug.replace(/\.mdx$/, '');
  const fullPath = path.join(blogDirectory, `${realSlug}.${locale}.mdx`);
  const fileContents = fs.readFileSync(fullPath, 'utf8');
  const post = matter(fileContents);
  const out: any = post;
  out.slug = realSlug;
  out.mdxSource = await serialize(post.content);
  return out;
}

interface MetaData {
  /** Author string e.g. `joep` */
  author: string;
  title: string;
  /** When it was published */
  date: string;
  [key: string]: any;
}

export interface BlogItemProp extends matter.GrayMatterFile<string> {
  /** Should be passed to an MDX component like this: {...mdxSource} */
  mdxSource: MDXRemoteSerializeResult<Record<string, unknown>>;
  /** last characters of the path of the URL, e.g. `linked-data-is-cool` */
  slug: string;
  /** information from the .mdx header  */
  data: MetaData;
}

export async function getAllPosts(locale = 'en'): Promise<BlogItemProp[]> {
  const filenames = fs.readdirSync(blogDirectory);
  const files: BlogItemProp[] = [];
  await Promise.all(
    filenames.map(async (name) => {
      const fullPath = path.join(blogDirectory, name);
      if (name.includes(`${locale}.mdx`)) {
        const post = matter(fs.readFileSync(fullPath, 'utf8')) as BlogItemProp;
        // The `orig` byte array causes JSON serialization errors
        post.orig = '';
        const truncated = post.content.slice(0, 300);
        post.mdxSource = await serialize(truncated);

        post.slug = name.slice(0, -7);
        files.push(post);
      }
    })
  );
  return files;
}

export async function getPage(slug: string, locale = 'en') {
  const fullPath = path.join(pageDirectory, `${slug}.${locale}.mdx`);
  const fileContents = fs.readFileSync(fullPath, 'utf8');
  const post = matter(fileContents);
  const out: any = post;
  // The `orig` byte array causes JSON serialization errors
  post.orig = '';
  out.slug = slug;
  out.mdxSource = await serialize(post.content);
  return out;
}
