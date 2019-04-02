import "@fortawesome/fontawesome-free/css/all.min.css";
import "bootstrap-css-only/css/bootstrap.min.css";
import "mdbreact/dist/css/mdb.css";
import "isomorphic-unfetch";
import React from "react";
import Link from "next/link";
import {
  MDBCard,
  MDBContainer,
  MDBCardBody,
  MDBCardTitle,
  MDBCardImage,
  MDBBtn
} from "mdbreact";
import QRCode from "qrcode.react";

var newId = function(size = 12) {
  const ALPHABET =
    "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
  var rtn = "";
  for (var i = 0; i < size; i++) {
    rtn += ALPHABET.charAt(Math.floor(Math.random() * ALPHABET.length));
  }
  return rtn;
};

const localStorage = (function() {
  if (typeof window === "undefined") {
    const store = {};
    return {
      setItem: function(key, value) {
        store[key] = value;
      },
      getItem: function(key) {
        return store[key];
      }
    };
  } else {
    return window.localStorage;
  }
})();

export default class GenerateCode extends React.Component {
  static async getInitialProps() {
    if (localStorage.getItem("clientToken")) {
      return { clientToken: localStorage.getItem("clientToken") };
    }
    if (!localStorage.getItem("deviceToken")) {
      localStorage.setItem("deviceToken", newId());
    }
    const res = await fetch(
      "http://localhost:3100/api/login/newSession?token=" +
        localStorage.getItem("deviceToken"),
      { mode: "cors" }
    );
    const { code, clientToken } = await res.json();
    if (clientToken) {
      localStorage.setItem("clientToken", clientToken);
    }
    return { code, clientToken };
  }

  renderCode() {
    if (this.props.code) {
      return (
        <div>
          <QRCode size={450} level="M" value={this.props.code} />
        </div>
      );
    }
    if (this.props.clientToken) {
      return (
        <MDBContainer>
          Already Logged In ..
          <Link href="/contacts">
            <MDBBtn>Move on...</MDBBtn>
          </Link>
        </MDBContainer>
      );
    }
    return <p>Loading ...</p>;
  }

  render() {
    return (
      <MDBContainer>
        <MDBCard
          className="card-body"
          style={{ width: "33rem", marginTop: "1rem" }}
        >
          <MDBCardBody>
            {this.renderCode()}

            <MDBCardTitle className="center">Scan on your Phone</MDBCardTitle>
          </MDBCardBody>
        </MDBCard>
      </MDBContainer>
    );
  }
}
