// Ticket-window search bar: pill-shaped input styled like a box-office
// counter. Same props/behavior as before, presentation only.
import { LuSearch } from "react-icons/lu";

type SearchProps = {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
};

const Search: React.FC<SearchProps> = ({ searchTerm, setSearchTerm }) => {
  return (
    <div className="ticket-search">
      <div>
        <LuSearch aria-hidden="true" />
        <input
          type="text"
          placeholder="Search for a title..."
          aria-label="Search for a movie title"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
    </div>
  );
};

export default Search;
