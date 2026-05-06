package nats

import (
	"fmt"
	"time"

	natsgo "github.com/nats-io/nats.go"
)

type Client struct {
	conn *natsgo.Conn
}

func Connect(url string) (*Client, error) {
	conn, err := natsgo.Connect(url,
		natsgo.RetryOnFailedConnect(true),
		natsgo.MaxReconnects(10),
		natsgo.ReconnectWait(2*time.Second),
		natsgo.Timeout(10*time.Second),
		natsgo.DisconnectErrHandler(func(nc *natsgo.Conn, err error) {
			fmt.Printf("NATS disconnected: %v\n", err)
		}),
		natsgo.ReconnectHandler(func(nc *natsgo.Conn) {
			fmt.Printf("NATS reconnected to %s\n", nc.ConnectedUrl())
		}),
	)
	if err != nil {
		return nil, fmt.Errorf("connect: %w", err)
	}

	return &Client{conn: conn}, nil
}

func (c *Client) Subscribe(subject string, handler func(data []byte)) (*natsgo.Subscription, error) {
	return c.conn.Subscribe(subject, func(msg *natsgo.Msg) {
		handler(msg.Data)
	})
}

func (c *Client) Publish(subject string, data []byte) error {
	return c.conn.Publish(subject, data)
}

func (c *Client) Close() {
	c.conn.Close()
}
