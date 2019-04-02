package services

import (
	"bytes"
	"encoding/gob"
	"io"
	"os"
	"os/user"
	"time"

	"github.com/moleculer-go/moleculer/payload"

	"github.com/Rhymen/go-whatsapp"
	"github.com/moleculer-go/moleculer"
)

// fileSessionReader use file to read session
func fileSessionReader(path string) (io.Closer, io.Reader, error) {
	user, err := user.Current()
	if err != nil {
		return nil, nil, err
	}
	fullpath := user.HomeDir + "/" + path
	file, err := os.Open(fullpath + "/whatsappSession.gob")
	if err != nil {
		return nil, nil, err
	}
	return file, file, nil
}

type mongoWriter struct {
	ctx     moleculer.Context
	session moleculer.Payload
	bts     []byte
}

func (w *mongoWriter) Write(p []byte) (n int, err error) {
	for _, b := range p {
		w.bts = append(w.bts, b)
	}
	return len(p), nil
}

//save document in mongo
func (w *mongoWriter) Close() error {
	sessionMap := w.session.RawMap()
	sessionMap["content"] = w.bts
	r := <-w.ctx.Call("session.update", sessionMap)
	if r.IsError() {
		return r.Error()
	}
	w.ctx.Logger().Debug("Session saved to Mongo!")
	return nil
}

func newSessionRecord(ctx moleculer.Context, token string) moleculer.Payload {
	session := payload.New(map[string]interface{}{
		"deviceToken": token,
	})
	return <-ctx.Call("session.create", session)
}

func mongoSessionWriter(ctx moleculer.Context, token string) (io.WriteCloser, error) {
	session := <-ctx.Call("session.find", map[string]interface{}{
		"query": map[string]interface{}{
			"deviceToken": token,
		},
	})
	if session.IsError() {
		return nil, session.Error()
	}
	if session.Len() == 0 || !session.Exists() {
		session = newSessionRecord(ctx, token)
		ctx.Logger().Debug("mongoSessionWriter() created new session: ", session)
	}
	ctx.Logger().Debug("mongoSessionWriter()  session found: ", session)
	if session.IsArray() {
		session = session.First()
	}
	var bts []byte
	if session.Get("content").Exists() {
		cbytes, ok := session.Get("content").Value().([]byte)
		if ok {
			bts = cbytes
		}
	}
	return &mongoWriter{ctx, session, bts}, nil
}

func mongoSessionReader(ctx moleculer.Context, token string) (io.Reader, error) {
	session := <-ctx.Call("session.find", map[string]interface{}{
		"query": map[string]interface{}{
			"deviceToken": token,
		},
	})
	ctx.Logger().Debug("mongoSessionWriter() session found: ", session, " deviceToken: ", token)
	if session.IsArray() && session.Len() > 0 {
		session = session.First()
	}
	if session.Get("content").Exists() {
		bts, ok := session.Get("content").Value().([]byte)
		if ok {
			return bytes.NewReader(bts), nil
		}
	}
	return bytes.NewReader([]byte{}), nil
}

// fileSessionWriter user file to write session
func fileSessionWriter(path string) (io.WriteCloser, error) {
	user, err := user.Current()
	if err != nil {
		return nil, err
	}
	fullpath := user.HomeDir + "/" + path
	err = os.MkdirAll(fullpath, os.ModeDir)
	if err != nil {
		return nil, err
	}
	file, err := os.Create(fullpath + "/whatsappSession.gob")
	if err != nil {
		return nil, err
	}
	return file, nil
}

// readSession read the whatsapp session from disk and return as object.
func readSession(ctx moleculer.Context, token string) (whatsapp.Session, error) {
	session := whatsapp.Session{}
	reader, err := mongoSessionReader(ctx, token) //fileSessionReader(path)
	if err != nil {
		return session, err
	}
	decoder := gob.NewDecoder(reader)
	err = decoder.Decode(&session)
	if err != nil {
		return session, err
	}
	return session, nil
}

//writeSession serialize the whatsapp session to disk
func writeSession(ctx moleculer.Context, session whatsapp.Session, token string) error {
	writer, err := mongoSessionWriter(ctx, token) //fileSessionWriter(token)
	defer writer.Close()
	encoder := gob.NewEncoder(writer)
	err = encoder.Encode(session)
	if err != nil {
		return err
	}
	return nil
}

// validConnection return a valid whatsapp connection
func validConnection(ctx moleculer.Context, params moleculer.Payload) (*whatsapp.Conn, whatsapp.Session, error) {
	token := params.Get("token").String()
	wac, err := whatsapp.NewConn(25 * time.Second)
	if err != nil {
		ctx.Logger().Error("error creating connection: ", err)
		return nil, whatsapp.Session{}, err
	}
	session, err := readSession(ctx, token)
	if err != nil {
		return wac, session, err
	}
	session, err = wac.RestoreWithSession(session)
	if err != nil {
		return wac, session, err
	}
	ctx.Logger().Debug("session restored!")
	return wac, session, nil
}

var Login = moleculer.Service{
	Name: "login",
	Actions: []moleculer.Action{
		{
			Name: "newSession",
			Handler: func(ctx moleculer.Context, params moleculer.Payload) interface{} {
				wac, session, err := validConnection(ctx, params)
				if err == nil {
					return payload.Empty().Add("clientToken", session.ClientToken)
				}
				ctx.Logger().Debug("No session, will generate a new scan code! - error: ", err)
				qr := make(chan string)

				go func() {
					session, err = wac.Login(qr)
					if err != nil {
						ctx.Logger().Error("error during login: ", err)
						return
					}
					token := params.Get("token").String()
					ctx.Logger().Debug("login was succesfull ! saving session with token: ", token)
					err = writeSession(ctx, session, token)
					if err != nil {
						ctx.Logger().Error("error saving session: ", err)
						return
					}
					ctx.Logger().Debug("session saved succesfull!")

				}()
				code := <-qr
				return payload.Empty().Add("code", code)
			},
		},
	},
}
