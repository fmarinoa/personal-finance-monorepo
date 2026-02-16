CREATE TABLE categories (
    code VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL
);

INSERT INTO categories (code, name) VALUES
    ('food', 'Alimentación'),
    ('transport', 'Transporte'),
    ('entertainment', 'Entretenimiento'),
    ('utilities', 'Servicios Públicos'),
    ('healthcare', 'Salud'),
    ('education', 'Educación'),
    ('shopping', 'Compras'),
    ('travel', 'Viajes'),
    ('other', 'Otros'),

CREATE TABLE expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    description VARCHAR(255) NOT NULL,
    category_code VARCHAR(50) REFERENCES categories(code) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT NULL
);

CREATE FUNCTION create_expense(
    p_user_id UUID,
    p_amount NUMERIC,
    p_description VARCHAR(255),
    p_category_code VARCHAR(50)
)
RETURNS TABLE(id UUID, user_id UUID, amount NUMERIC, description VARCHAR(255), category_code VARCHAR(50), created_at TIMESTAMPTZ) AS $$
BEGIN
    RETURN QUERY
    INSERT INTO expenses (user_id, amount, description, category_code)
    VALUES (p_user_id, p_amount, p_description, p_category_code)
    RETURNING expenses.id, expenses.user_id, expenses.amount, expenses.description, expenses.category_code, expenses.created_at;
END;
$$ LANGUAGE plpgsql;

CREATE FUNCTION update_expense(
    p_user_id UUID,
    p_id UUID,
    p_amount NUMERIC,
    p_description VARCHAR(255),
    p_category_code VARCHAR(50)
)
RETURNS TABLE(id UUID, user_id UUID, amount NUMERIC, description VARCHAR(255), category_code VARCHAR(50), updated_at TIMESTAMPTZ) AS $$
BEGIN
    RETURN QUERY
    UPDATE expenses
    SET 
        amount = COALESCE(p_amount, amount),
        description = COALESCE(p_description, description),
        category_code = COALESCE(p_category_code, category_code),
        updated_at = CURRENT_TIMESTAMP
    WHERE id = p_id AND user_id = p_user_id
    RETURNING expenses.id, expenses.user_id, expenses.amount, expenses.description, expenses.category_code, expenses.updated_at;
END;
$$ LANGUAGE plpgsql;

CREATE FUNCTION delete_expense(
    p_user_id UUID,
    p_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
    DELETE FROM expenses WHERE id = p_id AND user_id = p_user_id;
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

CREATE FUNCTION get_monthly_expenses_by_year(
    p_user_id UUID,
    p_year INT
)
RETURNS TABLE(month VARCHAR, total NUMERIC) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        to_char(created_at, 'YYYY-MM') AS month,
        SUM(amount) AS total
    FROM expenses
    WHERE user_id = p_user_id 
    AND EXTRACT(YEAR FROM created_at) = p_year
    GROUP BY to_char(created_at, 'YYYY-MM')
    ORDER BY month ASC;
END;
$$ LANGUAGE plpgsql;

CREATE INDEX idx_expenses_user_date ON expenses(user_id, created_at DESC);
CREATE INDEX idx_expenses_category ON expenses(category_code);
