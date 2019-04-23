import "@fortawesome/fontawesome-free/css/all.min.css";
import "bootstrap-css-only/css/bootstrap.min.css";
import "mdbreact/dist/css/mdb.css";
import "isomorphic-unfetch";
import React from "react";
import Link from "next/link";
import {
  MDBCard,
  MDBInput,
  MDBContainer,
  MDBCardBody,
  MDBCardTitle,
  MDBListGroup,
  MDBListGroupItem,
  MDBBtn,
  Alert
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
    let count = 0;
    if (this.state && this.state.messages) {
      count = this.state.messages
        .filter(m => m.id === contactId)
        .length;
    }
    return count;
  }

  userFilter() {
    const self = this;
    return item => {
      self.state = self.state || {};
      if(self.state.filter === "all" || !self.state.filter) {
        return true;
      }
      return item.type === self.state.filter;
    };
  }

  getName(item) {
    if (item.type === "group") {
      return item.group.subject;
    }
    return item.name;
  }

  rendeDetails(item) {
    if (item.type === "group") {
      return (
        <div>
          <div className="d-flex w-100 justify-content-between">
            <h6 className="mb-1">Name:</h6>
            {this.getName(item)}
          </div>
        </div>
      );
    }
    return (
      <div>
        
        <div className="d-flex w-100 justify-content-between">
          <h6 className="mb-1">Number:</h6>
          {item.mobile}
        </div>
        <div className="d-flex w-100 justify-content-between">
          <h6 className="mb-1">Status:</h6>
          {item.status}
        </div>  
      </div>
    );
  }

  renderContacts() {
    const { contacts } = this.props;
    if (!contacts || !contacts.map) {
      return <div>No contacts found :( </div>;
    }
    return contacts.filter(this.userFilter()).map(item => {
      return (
        <MDBListGroupItem key={item.id}>
          <div className="d-flex w-100 justify-content-between">
            <img width="100" height="100" src={item.profilePicThumb} />
          </div>
          {this.rendeDetails(item)}
          {this.renderMsgsPanel(item)}
          <hr />
        </MDBListGroupItem>
      );
    });
  }

  updateMsg(id, msg) {
    const state = this.state || {};
    state[`message_${id}`] = msg;
    this.setState(state)
  }

  // async sendGroupParticipantsMsg(contact) {
  //   const message = this.state[`message_${contact.id}`];
  //   this.setState({ ...this.state, loading: true });
  //   const { deviceToken } = this.props;
  //   const {group: {participants}} = contact;
  //   const msgs = await Promise.All(participants.map(async ({id}) => {
  //     const target = id.replace("@c.us", "@");
  //     const result = await postRequest("/api/chat/sendMessage", {
  //       deviceToken,
  //       message,
  //       target
  //     });

  //   })); 
    
  //   const {state} = this;
  //   state[`message_${contact.id}`] = "";
  //   this.setState({ ...state, loading: false });
  //   console.log("sendMessage() result: ", result);
  // }

  async sendGroupMsg(contact, individual) {
    const message = this.state[`message_${contact.id}`];
    this.setState({ ...this.state, loading: true });
    const { deviceToken } = this.props;
    const target = contact.mobile;
    const result = await postRequest("/api/chat/sendMessage", {
      contactId: contact.id,
      deviceToken,
      message,
      target,
      individual
    });
    const {state} = this;
    state[`message_${contact.id}`] = "";
    this.setState({ ...state, loading: false });
    console.log("sendMessage() result: ", result);
  }

  renderSendBtn(item) {
    if (this.state.loading) {
      return <div>Sending... </div>;
    }
    return (
      <div>
        <MDBBtn onClick={_ => this.sendGroupMsg(item)}>Send to Group</MDBBtn>  
        <MDBBtn onClick={_ => this.sendGroupMsg(item, true)}>Send to each Person</MDBBtn> 
      </div> 
    );
  }

  renderMsgsPanel(item) {
    if (item.type === "group") {
      return (
        <div>
          <MDBInput type="textarea" label="Broadcast messages to all group users:" rows="5"  
            onChange={e => this.updateMsg(item.id, e.target.value )}
            value={this.state[`message_${item.id}`]} />
          {this.renderSendBtn(item)}
        </div>
      );
    }
    return (
      <Link href={`/messages?target=${item.mobile}`}>
        <MDBBtn>Messages [{this.countMessagesByContact(item.id)}]</MDBBtn>
      </Link>
    );
  }

  filter(type) {
    this.setState({...this.state, filter: type});
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
            <MDBBtn onClick={() => this.filter("all")}>All</MDBBtn>
            <MDBBtn onClick={() => this.filter("person")}>People</MDBBtn>
            <MDBBtn onClick={() => this.filter("group")}>Groups</MDBBtn>
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
