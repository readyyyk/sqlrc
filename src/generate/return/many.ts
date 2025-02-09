import { capitalize, trimLeftTempl, type TGenerateFunc } from "../utils";

export const generateReturnMany: TGenerateFunc = (query, d) => {
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
        func (q *Queries) ${functionName}(ctx context.Context, arg ${d.paramsName}) (*[]${d.resultName}, error) {
            rows, err := q.DB.QueryContext(ctx, ${d.sqlName}, ${completeGoParams})
            if err != nil {
                return nil, err
            }
            defer rows.Close()
            var items []${d.resultName}
            for rows.Next() {
                var i ${d.resultName}
                if err := rows.Scan(
                    ${Object.keys(d.resultFields).map(s => `&i.${s},`).join('\n')}
                ); err != nil {
                    return nil, err
                }
                items = append(items, i)
            }
            if err := rows.Close(); err != nil {
                return nil, err
            }
            if err := rows.Err(); err != nil {
                return nil, err
            }
            return &items, nil
        }`;
    return result;
};