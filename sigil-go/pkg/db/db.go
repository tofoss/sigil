package db

import (
	"context"
	"fmt"
	"log"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

func NewPool() *pgxpool.Pool {
	pool, err := pgxpool.New(context.Background(), buildPostgresDSN())
	if err != nil {
		log.Fatal("Unable to connect to database:", err)
	}

	return pool
}

func buildPostgresDSN() string {
	config, err := pgx.ParseConfig("")
	if err != nil {
		panic(fmt.Sprintf("Failed to parse PG config: %v", err))
	}

	return config.ConnString()
}
