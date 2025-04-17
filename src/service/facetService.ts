import { FacetName } from 'src/types/enums/FacetName';
import { IPlayerNewSearchResult } from 'src/types/responses/iplayer/IPlayerNewSearchResponse';
import { SearchFacets } from 'src/types/responses/SearchResponse';


const facetActionMap : Record<FacetName, (result : IPlayerNewSearchResult, values? : string[]) => boolean> = {
    Category: (result : IPlayerNewSearchResult, values? : string[]) : boolean => {
        return result.categories.some((cat) => values?.includes(cat));
    },
    Channel: (result : IPlayerNewSearchResult, values? : string[]) : boolean => {
        return result.master_brand?.titles?.large != undefined && (values != undefined && values.includes(result.master_brand?.titles?.large))
    },
    Type: (result : IPlayerNewSearchResult, values? : string[]) : boolean => {
        return (values?.includes('TV') && result.count != undefined) || (!values?.includes('TV') && result.count == undefined);
    },
    Episode: () : boolean => {
        return true;
    },
    Series: () : boolean => {
        return true;
    }
}

class FacetService {
    facetResults(results : IPlayerNewSearchResult[], facets : SearchFacets) : IPlayerNewSearchResult[] {
        return results.filter((result) => {
            for (const facetName of Object.keys(facets)){
                const matches = this.matchesFacet(result, facetName as FacetName, facets[facetName as FacetName]);
                if (!matches) return false;
            }
            return true;
        })
    }

    matchesFacet(result: IPlayerNewSearchResult, facetName: FacetName, values?: string[]) : boolean {
        return (facetActionMap as any)[facetName](result, values);
    }

    getSingularFacet(facets : SearchFacets, facetName : FacetName) : string | undefined {
        const values = facets[facetName];
        return values && values.length >0 ? values[0] : undefined;
    }
}

export default new FacetService();