import { sanityClient, urlFor } from '../../sanity';
import Header from '../../components/Header';
import { GetStaticProps } from 'next';
import { Post } from '../../typings';
import PortableText from 'react-portable-text';

// We need to define our prop types
interface Props {
  post: Post;
}

// Was props: Props before destructuring
function Post({ post }: Props) {
  // console.log(post);

  return (
    <main>
      <Header />

      <img
        className='w-full h-48 object-cover'
        src={urlFor(post.mainImage).url()!}
        alt=''
      />

      <article className='max-w-3xl mx-auto p-5'>
        <h1 className='text-3xl mt-q0 mb-3'>{post.title}</h1>
        <h2 className='text-xl font-light text-gray-500 mb-2'>{post.description}</h2>

        <div className='flex items-center space-x-2'>
          <img
            className='h-10 w-10 rounded-full'
            src={urlFor(post.author.image).url()!}
            alt=''
          />
          <p className='font-extralight text-sm'>
            Blog post by <span className='text-green-600'>{post.author.name}</span> - Published at {new Date(post._createdAt).toLocaleString()}
          </p>
        </div>

        <div className='mt-10'>
          <PortableText
            className=''
            dataset={process.env.NEXT_PUBLIC_SANITY_DATASET!}
            projectId={process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!}
            content={post.body}
            serializers={
              {
                h1: (props: any) => (
                  <h1 className='text-2xl font-bold my-5' {...props} />
                ),
                h2: (props: any) => (
                  <h1 className='text-2xl font-bold my-5' {...props} />
                ),
                li: ({ children }: any) => (
                  <li className='ml-4 list-disc'>{ children }</li>
                ),
                link: ({ href, children }: any) => (
                  <a href={href} className='text-blue-500 hover:underline'>
                    {children}
                  </a>
                )
              }
            }
          />
        </div>

        <hr className='max-w-lg my-5 mx-auto border border-yellow-500' />

        <form className='flex flex-col p-5 max-w-2xl mx-auto mb-10'>
          <h3 className='text-sm text-yellow-500'>Enjoyed the article?</h3>
          <h4 className='text-3xl font-bold'>Leave a comment below!</h4>
          <hr className='py-3 mt-2' />

          <label>
            <span>Name</span>
            <input placeholder='Kaitlin Berryman' type='text'/>
          </label>

          <label>
            <span>Email</span>
            <input placeholder='kaitlinberryman@gmail.com' type='text'/>
          </label>

          <label>
            <span>Comment</span>
            <textarea placeholder='Coolest Name Ever' rows={8}/>
          </label>
        </form>


      </article>
    </main>
  );
}

export default Post;

export const getStaticPaths =  async () => {
  // pre-fetch all routes with a query from Sanity CMS to find all posts for us
  // GROQ syntax from Sanity CMS
  const query = `*[_type =="post"]{
    _id,
    slug {
      current
    }
  }`;

  const posts = await sanityClient.fetch(query);

  // figure out the paths
  // we need to pass Next.js the paths as an array where each object
  // has a key called params and then the path inside of it
  // this creates a list of paths. this is the structure Next.js expects
  const paths = posts.map((post: Post) => ({
    params: {
      slug: post.slug.current
    }
  }));

  return {
    paths,
    // show 404 page if it doesn't exist
    fallback: 'blocking'
  };
};

// destructure context to get params out
export const getStaticProps: GetStaticProps = async ({ params }) => {
  // query for post
  // the slug is a placeholder for the actual slug
  // this will return an array back and [0] specifies the first post

  const query = `*[_type == "post" && slug.current == $slug][0]{
    _id,
    _createdAt,
    title,
    author-> {
      name,
      image
    },
    'comments': *[
      _type == "comment" &&
      post._ref == ^._id &&
      approved == true],
    description,
    mainImage,
    slug,
    body
  }`
  // pass in value to replace slug placeholder
  const post = await sanityClient.fetch(query, {
    slug: params?.slug,
  });

  // return a 404 page if page isn't found
  if(!post) {
    return {
      notFound: true
    }
  }

  return {
    props: {
      post,
    },
    // after 60 seconds, update the old cached version
    revalidate: 60,
  }
}
