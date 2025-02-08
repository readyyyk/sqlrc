import { ALLOWED_OWN_TYPES, isALLOWED_OWN_TYPES, type TParamedQuery, TQueryToken, TWResolvedReturnQuery } from "../../types";


const PARAM_REGEX = /(\<\@)([^:]+):([^\@]+)(\@\>)/g
const NAME_GROUP_IDX = 2;
const TYPE_GROUP_IDX = 3;


export const parseQueryParams = (queryToken: TQueryToken): TParamedQuery => {
  const result: TParamedQuery = {
    queryToken,
    params: {},
    resultSql: '',
  }

  result.resultSql = queryToken.sql.replaceAll(PARAM_REGEX, '?');
  
  const matches = result.queryToken.sql.matchAll(PARAM_REGEX);
  let i=0;
  for (const match of matches) {
    const name = match[NAME_GROUP_IDX];
    const _type = match[TYPE_GROUP_IDX];

    if (!isALLOWED_OWN_TYPES(_type)) {
      throw new Error(
        "Invalid own type. \nGot: " +
          _type +
          "\nAllowed are: " +
          JSON.stringify(ALLOWED_OWN_TYPES),
      );
    }

    result.params[name] = {
      name,
      type: _type,
      positions: result.params[name]?.positions
        ? result.params[name].positions.concat(i)
        : [i],
    }

    i++;
  }

  return result;
}
