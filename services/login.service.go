package services

import (
	"bytes"
	"encoding/gob"
	"io"
	"os"
	"os/user"

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
	sessionMap["content"] = string(w.bts)
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
	return &mongoWriter{ctx, session, []byte{}}, nil
}

func mongoSessionReader(ctx moleculer.Context, token string) (io.Reader, error) {
	session := <-ctx.Call("session.find", map[string]interface{}{
		"query": map[string]interface{}{
			"deviceToken": token,
		},
	})
	if session.IsArray() && session.Len() > 0 {
		session = session.First()
	}
	if session.Get("content").Exists() {
		content := session.Get("content").String()
		return bytes.NewReader([]byte(content)), nil
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
	reader, err := mongoSessionReader(ctx, token)
	if err != nil {
		return session, err
	}
	decoder := gob.NewDecoder(reader)
	err = decoder.Decode(&session)
	if err != nil {
		ctx.Logger().Error("Error trying to decode session object - error: ", err)
		return session, err
	}
	return session, nil
}

//writeSession serialize the whatsapp session to disk
func writeSession(ctx moleculer.Context, session whatsapp.Session, token string) error {
	writer, err := mongoSessionWriter(ctx, token)
	if err != nil {
		return err
	}
	defer writer.Close()
	encoder := gob.NewEncoder(writer)
	err = encoder.Encode(session)
	if err != nil {
		return err
	}
	return nil
}

var Login = moleculer.ServiceSchema{
	Name: "login",
	Actions: []moleculer.Action{
		{
			Name: "newSession",
			Handler: func(ctx moleculer.Context, params moleculer.Payload) interface{} {
				wac, session, err := validSession(ctx, params.Get("deviceToken").String())
				if err == nil {
					return payload.Empty().Add("clientToken", session.ClientToken)
				}
				ctx.Logger().Debug("No session, will generate a new scan code! - error: ", err)
				qr := make(chan string)
				go func() {
					deviceToken := params.Get("deviceToken").String()
					session, err = wac.Login(qr)
					if err != nil {
						ctx.Logger().Error("error during login: ", err)
						ctx.Broadcast("login.fail", map[string]interface{}{"deviceToken": deviceToken, "error": "Login error: " + err.Error()})
						return
					}
					ctx.Logger().Debug("login was succesfull ! saving session with deviceToken: ", deviceToken)
					err = writeSession(ctx, session, deviceToken)
					if err != nil {
						ctx.Logger().Error("error saving session: ", err)
						ctx.Broadcast("login.fail", map[string]interface{}{"deviceToken": deviceToken, "error": "Could not save session!"})
						return
					}
					saveCache(deviceToken, wac, &session)
					ctx.Logger().Debug("session saved succesfull!")
					ctx.Broadcast("login.success", map[string]interface{}{"deviceToken": deviceToken})
				}()
				code := <-qr
				return payload.Empty().Add("code", code)
			},
		},
	},
}
