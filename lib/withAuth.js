import React from "react";
import PropTypes from "prop-types";
import Router from "next/router";
import { getDeviceToken } from "./deviceToken";
import { postRequest } from "./request";
import LoginPanel from "../components/login.panel";

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
      const list = await postRequest("/api/session/find", {
        query: { deviceToken }
      });
      let session = null;
      if (list.length > 0) {
        session = list[0];
      }
      console.log("session -> ", session, " deviceToken: ", deviceToken);
      const props = { deviceToken, session, isFromServer };
      ctx.session = session;
      ctx.deviceToken = deviceToken;
      ctx.isFromServer = isFromServer;
      if (BaseComponent.getInitialProps) {
        Object.assign(props, (await BaseComponent.getInitialProps(ctx)) || {});
      }
      return props;
    }

    componentDidMount() {
      const { session } = this.props;

      if (this.props.isFromServer) {
        //globalSession = session;
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
