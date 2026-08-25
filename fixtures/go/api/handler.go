package api

import (
	"example.com/shop/payment"
)

type Handler struct {
	client *payment.StripeClient
}

func (h *Handler) Checkout(amount int) error {
	return h.client.Charge(amount)
}

func NewHandler() *Handler {
	return &Handler{client: payment.New("sk_test")}
}
