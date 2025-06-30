import os
from sqlalchemy import create_engine
from sqlalchemy.dialects.postgresql import insert as pg_insert


def db_response_to_json(res, field=None):
    # Handle single row
    if hasattr(res, "_mapping"):
        if field is not None:
            return dict(res._mapping)[field]
        else:
            return dict(res._mapping)

    # Handle multiple rows
    if field is not None:
        return [dict(row._mapping)[field] for row in res]
    else:
        return [dict(row._mapping) for row in res]


def setup_database_connection():
    """Set up and return a database engine using environment variables"""
    return create_engine(os.getenv("DATABASE_URL"))


def safe_float(value):
    """Safely convert a value to float, returning None if conversion fails"""
    if value is None or value == "":
        return None
    try:
        return float(value)
    except (ValueError, TypeError):
        return None


def upsert_records(engine, table, data, conflict_columns, update_columns=None, record_type="records"):
    """
    Generic upsert function for inserting records with conflict resolution
    
    Args:
        engine: SQLAlchemy engine
        table: SQLAlchemy table object
        data: List of dictionaries containing record data
        conflict_columns: List of column names that define uniqueness
        update_columns: List of columns to update on conflict (optional)
        record_type: String description of record type for logging
    """
    if not data:
        print(f"No {record_type} data to insert.")
        return

    with engine.begin() as conn:
        try:
            # Use PostgreSQL's ON CONFLICT to handle duplicates
            stmt = pg_insert(table).values(data)
            
            if update_columns:
                # Update specified columns on conflict
                update_dict = {
                    col: stmt.excluded[col] 
                    for col in update_columns
                }
            else:
                # Update all columns except conflict columns and auto-generated ones
                excluded_cols = set(conflict_columns + ['id', 'created_at', 'updated_at'])
                update_dict = {
                    col.name: stmt.excluded[col.name] 
                    for col in table.columns 
                    if col.name not in excluded_cols
                }
            
            stmt = stmt.on_conflict_do_update(
                index_elements=conflict_columns,
                set_=update_dict
            )
            
            conn.execute(stmt)
            print(f"✅ Upserted {len(data)} {record_type}")
            
        except Exception as e:
            print(f"🚨 Insert failed due to error: {e}")
            return
