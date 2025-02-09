--@ sqlrc:GetRepeated:one
SELECT id, walias a, * al FROM users WHERE id = <@id:int@> AND <@id:int@> > 10;


--@ sqlrc:GetJoin:many
SELECT u.*, f.*
FROM users as u
LEFT JOIN friends f
ON f.id = u.id
where u.username = <@username:string@>;

--@ sqlrc:InsertMultiReturning:one
INSERT INTO products (name, price)
VALUES (
    'Phone',
    (SELECT price FROM (
        DELETE FROM temp_prices 
        WHERE product_name = 'Phone'
        RETURNING price
    ) as deleted_price)
)
RETURNING 
    id,
    name product_name,
    price * 0.2 tax,
    price * 1.2 as price_with_tax;

--@ sqlrc:SelectScaryReturn:many
-- WITH dept_stats AS (
--     SELECT 
--         d.id,
--         d.name,
--         COUNT(*) AS emp_count,
--         AVG(e.salary) AS avg_salary
--     FROM departments d
--     LEFT JOIN employees e ON d.id = e.department_id
--     GROUP BY d.id, d.name
-- )
SELECT
    e.first_name AS employee_name,
    e.salary current_salary,
    e.salary * 1.1 AS projected_salary,
    d.name AS department,
    ds.emp_count AS department_size,
    ds.avg_salary AS dept_avg_salary,
    -- CASE 
    --     WHEN e.salary > ds.avg_salary THEN 'Above Average'
    --     ELSE 'Below Average'
    -- END AS salary_comparison,
    -- RANK() OVER (PARTITION BY e.department_id ORDER BY e.salary DESC) AS dept_salary_rank
FROM employees as e
JOIN departments d ON e.department_id = d.id
JOIN dept_stats ds ON d.id = ds.id
WHERE e.salary > (SELECT AVG(salary) FROM employees)
ORDER BY e.salary DESC;