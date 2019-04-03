import React from "react";
import PropTypes from "prop-types";
import Router from "next/router";
import "isomorphic-unfetch";
import { getDeviceToken } from "./deviceToken";
import LoginPanel from "../components/login.panel";
let globalSession = null;
export default function withAuth(
  BaseComponent,
  { loginRequired = true, logoutRequired = false, adminRequired = false } = {}
) {
  class App extends React.PureComponent {
    static propTypes = {
      session: PropTypes.shape({
        deviceToken: PropTypes.string
      }),
      isFromServer: PropTypes.bool.isRequired
    };

    static defaultProps = {
      session: null
    };

    static async getInitialProps(ctx) {
      const isFromServer = !!ctx.req;
      const deviceToken = getDeviceToken(ctx);
      const headers = {
        "Content-type": "application/json; charset=UTF-8"
      };
      let session = await (await fetch(
        "http://localhost:3100/api/session/find",
        {
          headers,
          method: "POST",
          body: JSON.stringify({
            query: {
              deviceToken
            }
          })
        }
      )).json();
      console.log("session -> ", session, " deviceToken: ", deviceToken);
      if (session.length == 0) {
        session = null;
      }
      globalSession = session;
      const props = { deviceToken, session, isFromServer };
      ctx.session = session;
      ctx.deviceToken = deviceToken;
      if (BaseComponent.getInitialProps) {
        Object.assign(props, (await BaseComponent.getInitialProps(ctx)) || {});
      }

      return props;
    }

    componentDidMount() {
      const { session } = this.props;

      if (this.props.isFromServer) {
        globalSession = session;
      }

      if (loginRequired && !logoutRequired && !session) {
        Router.push("/public/login", "/login");
        return;
      }
      if (logoutRequired && session) {
        Router.push("/");
      }
    }

    render() {
      const { session } = this.props;

      if (loginRequired && !logoutRequired && !session) {
        return <LoginPanel />;
      }

      if (logoutRequired && session) {
        return <LoginPanel />;
      }

      return <BaseComponent {...this.props} />;
    }
  }

  return App;
}
