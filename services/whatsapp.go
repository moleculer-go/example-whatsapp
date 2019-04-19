package services

import (
	"errors"
	"fmt"
	"time"

	"github.com/Rhymen/go-whatsapp"
	"github.com/moleculer-go/moleculer"
	"github.com/patrickmn/go-cache"
)

var connectionDuration = 2 * time.Minute

var connections *cache.Cache

func ensureCache() {
	if connections == nil {
		connections = cache.New(connectionDuration, time.Second*5)
		connections.OnEvicted(func(deviceToken string, value interface{}) {
			connCache := value.(connSessionCache)
			_, err := connCache.conn.Disconnect()
			if err != nil {
				fmt.Println("[Error] error when trying to disconnect")
			} else {
				fmt.Println("connections.OnEvicted() connection disconnected!")
			}
		})
	}
}

type connSessionCache struct {
	conn    *whatsapp.Conn
	session *whatsapp.Session
}

func saveCache(deviceToken string, wac *whatsapp.Conn, session *whatsapp.Session) {
	ensureCache()
	connections.Set(deviceToken, connSessionCache{wac, session}, 0)
}

func fromCache(deviceToken string) (*whatsapp.Conn, *whatsapp.Session, error) {
	ensureCache()
	v, found := connections.Get(deviceToken)
	if !found {
		return nil, nil, errors.New(fmt.Sprint("No Connection found for deviceToken: ", deviceToken))
	}
	cacheItem, ok := v.(connSessionCache)
	if !ok {
		return nil, nil, errors.New("Could not convert obj from cache!")
	}
	return cacheItem.conn, cacheItem.session, nil
}

// validSession return a valid whatsapp connection
func validSession(ctx moleculer.Context, deviceToken string) (*whatsapp.Conn, whatsapp.Session, error) {
	wac, sessionP, err := fromCache(deviceToken)
	if err == nil {
		return wac, *sessionP, nil
	}
	wac, err = whatsapp.NewConn(connectionDuration)
	if err != nil {
		return wac, whatsapp.Session{}, err
	}
	session, err := readSession(ctx, deviceToken)
	if err != nil {
		ctx.Logger().Error("error reading session - error: ", err)
		return wac, whatsapp.Session{}, err
	}
	if session.ClientToken == "" {
		session, err = wac.RestoreWithSession(session)
		if err != nil {
			ctx.Logger().Error("error restoring session - error: ", err)
			return wac, whatsapp.Session{}, err
		}
	}
	saveCache(deviceToken, wac, &session)
	ctx.Logger().Debug("Session restored!")
	return wac, session, nil
}
