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
