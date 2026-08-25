package payment

import (
	"fmt"
	"errors"
)

// Charger is not a struct: "func Fake(" inside this comment must be ignored.
type Charger interface {
	Charge(amount int) error
	Refund(id string) error
}

type Base struct {
	Currency string
}

type StripeClient struct {
	Base
	key string
}

func (s *StripeClient) Charge(amount int) error {
	if amount <= 0 {
		return errors.New("invalid amount")
	}
	fmt.Println("charged")
	return nil
}

func (s *StripeClient) Refund(id string) error { return nil }

func New(key string) *StripeClient {
	return &StripeClient{key: key}
}

const notAFunc = "func Decoy(int) error"
