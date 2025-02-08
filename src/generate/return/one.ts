import { capitalize, trimLeftTempl, type TGenerateFunc } from "../utils";

export const generateReturnOne: TGenerateFunc = (query, sqlName, paramsName) => {
  let result = "";
  const goParams = Object.entries(query.params)
    .reduce((acc, [name, p]) => {
      for (const pos of p.positions) {
        acc[pos] = name;
      }
      return acc;
    }, [] as string[]);
  const completeGoParams = goParams.map(p=>"arg."+capitalize(p)).join(', ');
  const functionName = capitalize(query.queryToken.name);
  result += trimLeftTempl`\n
    func (q *Queries) ${functionName}(ctx context.Context, arg ${paramsName}) (*TO_BE_DONE, error) {
      row := q.DB.QueryRowContext(ctx, ${sqlName}, ${completeGoParams}) 
      var i TO_BE_DONE
        err := row.Scan(
          &i.Fk,
          &i.Id,
          &i.Text,
        )
        return &i, err
    }`
  return result;
}
