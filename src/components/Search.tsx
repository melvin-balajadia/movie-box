import { LuSearch } from "react-icons/lu";

type SearchProps = {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
};

const Search: React.FC<SearchProps> = ({ searchTerm, setSearchTerm }) => {
  return (
    <div className="search">
      <div>
        <LuSearch className="text-gray-50 text-lg" />
        <input
          type="text"
          placeholder="Search through thousands of movies"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
    </div>
  );
};

export default Search;
