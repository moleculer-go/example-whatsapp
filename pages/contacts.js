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
  MDBListGroup,
  MDBListGroupItem,
  MDBBtn
} from "mdbreact";
import withAuth from "../lib/withAuth";
import { postRequest, subscriber } from "../lib/request";
class Contacts extends React.Component {
  static async getInitialProps(ctx) {
    let contacts = [];
    if (ctx.session) {
      const { deviceToken } = ctx;
      contacts = await postRequest("/api/contacts/find", {
        query: { deviceToken }
      });
      console.log("contacts -> ", contacts, " ctx.deviceToken: ", deviceToken);
    }
    return { contacts };
  }

  storeMessages() {
    localStorage.setItem("messages", JSON.stringify(this.state.messages));
  }

  restoreMessages() {
    const value = localStorage.getItem("messages");
    if (value == null || value == "") {
      return;
    }
    const messages = JSON.parse(value);
    this.setState({ ...this.state, messages });
  }

  async componentDidMount() {
    this.setState({ messages: new Array() });
    const subscribe = subscriber("deviceToken", this.props.deviceToken);
    await subscribe("chat.message", msg => {
      console.log("chat.message event msg: ", msg);
      const messages = this.state.messages || new Array();
      messages.push(msg);
      this.setState({ ...this.state, messages });
      this.storeMessages();
    });
  }

  countMessagesByContact(contactId) {
    const count = 0;
    if (this.state && this.state.messages) {
      count = this.state.messages
        .filter(m => m.contactId === contactId)
        .length();
    }
    return <div>{count}</div>;
  }

  renderContacts() {
    const { contacts } = this.props;
    if (!contacts || !contacts.map) {
      return <div>No contacts found :( </div>;
    }
    return contacts.map(item => {
      return (
        <MDBListGroupItem key={item.id}>
          <div className="d-flex w-100 justify-content-between">
            <h6 className="mb-1">Name:</h6>
            {item.name}
          </div>
          <div className="d-flex w-100 justify-content-between">
            <h6 className="mb-1">Number:</h6>
            {item.mobile}
          </div>
          <Link href={`/messages?target=${item.mobile}`}>
            <MDBBtn>Messages [{this.countMessagesByContact(item.id)}]</MDBBtn>
          </Link>
          <hr />
        </MDBListGroupItem>
      );
    });
  }

  render() {
    return (
      <MDBContainer>
        <MDBCard
          className="card-body"
          style={{ width: "33rem", marginTop: "1rem" }}
        >
          <MDBCardBody>
            <MDBCardTitle>Contacts</MDBCardTitle>
            <MDBContainer>
              <MDBListGroup style={{ width: "22rem" }}>
                {this.renderContacts()}
              </MDBListGroup>
            </MDBContainer>
            <Link href="/newContact">
              <MDBBtn>New Contact</MDBBtn>
            </Link>
          </MDBCardBody>
        </MDBCard>
      </MDBContainer>
    );
  }
}

export default withAuth(Contacts);
