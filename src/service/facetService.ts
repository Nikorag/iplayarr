import { IPlayerNewSearchResult } from 'src/types/responses/iplayer/IPlayerNewSearchResponse';
import { SearchFacets } from 'src/types/responses/SearchResponse';

const facetService = {
    facetResults :(results : IPlayerNewSearchResult[], facets : SearchFacets) : IPlayerNewSearchResult[] => {
        return results.filter((result) => {
            for (const facetName of Object.keys(facets)){
                const matches = facetService.matchesFacet(result, facetName, facets[facetName]);
                if (!matches) return false;
            }
            return true;
        })
    },

    matchesFacet : (result: IPlayerNewSearchResult, facetName: string, values: string[]) => {
        return (facetService.facetActionMap as any)[facetName](result, values);
    },

    facetActionMap: {
        Category: (result : IPlayerNewSearchResult, values : string[]) => {
            return result.categories.some((cat) => values.includes(cat));
        },
        Channel: (result : IPlayerNewSearchResult, values : string[]) => {
            return result.master_brand?.titles?.large && values.includes(result.master_brand?.titles?.large);
        },
        Type: (result : IPlayerNewSearchResult, values : string[]) => {
            return (values.includes('TV') && result.count) || (!values.includes('TV') && !result.count);
        }
    }
}

export default facetService;