// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next'
import sanityClient from '@sanity/client';

const config = {
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  useCdn: process.env.NODE_ENV === 'production',
  token: process.env.SANITY_API_TOKEN,
};

const client = sanityClient(config);

export default async function createComment(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { _id, name, email, comment } = JSON.parse(req.body);

  try {
    // create a document in Sanity CMS
    await client.create({
      // we're creating a new type comment, so we'll need a need schema too
      _type: 'comment',
      post: {
        _type: 'reference',
        _ref: _id
      },
      name,
      email,
      comment
    });
  } catch (err) {
    console.log(err);
    return res.status(418).json({ message: `Couldn't submit comment, so I turned into a teacup`, err });
  }

  console.log('Comment Submitted :D'); // in terminal
  return res.status(200).json({ message: 'Comment Submitted :D' })
}