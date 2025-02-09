import { capitalize, trimLeftTempl, type TGenerateFunc } from "../utils";

export const generateReturnOne: TGenerateFunc = (query, d) => {
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
    func (q *Queries) ${functionName}(ctx context.Context, arg ${d.paramsName}) (*${d.resultName}, error) {
      row := q.DB.QueryRowContext(ctx, ${d.sqlName}, ${completeGoParams}) 
      var i ${d.resultName}
        err := row.Scan(
          ${Object.keys(d.resultFields).map(s => `&i.${s},`).join('\n')}
        )
        return &i, err
    }`
  return result;
}
