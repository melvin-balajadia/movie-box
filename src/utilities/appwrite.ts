import { Client, Databases, ID, Query, Models } from "appwrite";

const PROJECT_ID: string = import.meta.env.VITE_APPWRITE_PROJECT_ID;
const COLLECTION_ID: string = import.meta.env.VITE_APPWRITE_COLLECTION_ID;
const DATABASE_ID: string = import.meta.env.VITE_APPWRITE_DATABASE_ID;

const client = new Client()
  .setEndpoint("https://cloud.appwrite.io/v1")
  .setProject(PROJECT_ID);

const database = new Databases(client);

interface Movie {
  id: number;
  poster_path: string;
}

interface SearchDocument extends Models.Document {
  searchTerm: string;
  poster_url: string;
  movie_id: number;
  count: number;
}

export const updateSearchCount = async (
  searchTerm: string,
  movie: Movie
): Promise<void> => {
  console.log(PROJECT_ID, COLLECTION_ID, DATABASE_ID);
  try {
    const result = await database.listDocuments<SearchDocument>(
      DATABASE_ID,
      COLLECTION_ID,
      [Query.equal("searchTerm", searchTerm)]
    );

    if (result.documents.length > 0) {
      const doc = result.documents[0];
      await database.updateDocument<SearchDocument>(
        DATABASE_ID,
        COLLECTION_ID,
        doc.$id,
        {
          count: doc.count + 1,
        }
      );
    } else {
      await database.createDocument<SearchDocument>(
        DATABASE_ID,
        COLLECTION_ID,
        ID.unique(),
        {
          searchTerm,
          poster_url: `https://image.tmdb.org/t/p/w500${movie.poster_path}`,
          movie_id: movie.id,
          count: 1,
        }
      );
    }
  } catch (error) {
    console.error("Error updating search count:", error);
  }
};

export const getTrendingMovies = async (): Promise<
  SearchDocument[] | undefined
> => {
  try {
    const result = await database.listDocuments<SearchDocument>(
      DATABASE_ID,
      COLLECTION_ID,
      [Query.limit(5), Query.orderDesc("count")]
    );

    return result.documents;
  } catch (error) {
    console.error("Error fetching trending movies:", error);
  }
};
