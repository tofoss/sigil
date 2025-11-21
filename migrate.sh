for f in $(ls db/V*.sql | sort -V); do
    PGPASSWORD=${PGPASSWORD} psql -h localhost -U ${PGUSER} -d ${PGDATABASE} -f "$f"
done

