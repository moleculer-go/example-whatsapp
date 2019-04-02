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

export default class Contacts extends React.Component {
  static async getInitialProps() {
    if (!localStorage.getItem("clientToken")) {
      return { validSession: false };
    }
    const res = await fetch(
      "http://localhost:3100/api/chat/contacts?token=" +
        localStorage.getItem("deviceToken"),
      { mode: "cors" }
    );
    const data = await res.json();
    console.log(data);

    return { data };
  }

  renderContacts() {
    return (
      <div>
        <br />
      </div>
    );
  }

  render() {
    if (!this.props.validSession) {
      return (
        <div>
          You Need to Login first !
          <br />
          <Link href="/generateCode">
            <MDBBtn>Login</MDBBtn>
          </Link>
        </div>
      );
    }
    return (
      <MDBContainer>
        <MDBCard
          className="card-body"
          style={{ width: "33rem", marginTop: "1rem" }}
        >
          <MDBCardBody>
            <MDBCardTitle>Contacts</MDBCardTitle>
            {this.renderContacts()}
          </MDBCardBody>
        </MDBCard>
      </MDBContainer>
    );
  }
}
