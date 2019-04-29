import "@fortawesome/fontawesome-free/css/all.min.css";
import "bootstrap-css-only/css/bootstrap.min.css";
import "mdbreact/dist/css/mdb.css";
import "isomorphic-unfetch";
import React from "react";
import Link from "next/link";
import {
  MDBCollapse,
  MDBRow,
  MDBCol,
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
    await subscribe("chat.message.received", msg => {
      console.log("chat.message.received event msg: ", msg);
      const messages = this.state.messages || new Array();
      messages.push(msg);
      this.setState({ ...this.state, messages });
      this.storeMessages();
    });
  }

  countMessagesByContact(contactId) {
    let count = 0;
    if (this.state && this.state.messages) {
      count = this.state.messages.filter(m => m.id === contactId).length;
    }
    return count;
  }

  userFilter() {
    const self = this;
    return item => {
      self.state = self.state || {};
      if (self.state.filter === "all" || !self.state.filter) {
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

  renderGroupDetails(item) {
    return (
      <div className="ml-2">
        <h5>{this.getName(item)}</h5>
        {this.renderGroupMsgBtn(item)}
      </div>
    );
  }

  renderPersonDetails(item) {
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

  renderGroupMsgBtn(item) {
    const isOpen = this.state.msgPanelOpen[item.id];
    if (!isOpen) {
      return (
        <MDBBtn
          size="sm"
          onClick={e => {
            const { msgPanelOpen } = this.state;
            msgPanelOpen[item.id] = true;
            this.setState({ ...this.state, msgPanelOpen });
          }}
        >
          Message
        </MDBBtn>
      );
    }
  }

  renderGroupMsg(item) {
    const isOpen = this.state.msgPanelOpen[item.id];
    return (
      <div>
        <MDBCollapse id={`collapseItemMsg_${item.id}`} isOpen={isOpen}>
          <MDBInput
            type="textarea"
            label="Broadcast to all group users"
            rows="5"
            onChange={e => this.updateMsg(item.id, e.target.value)}
            value={this.state[`message_${item.id}`]}
          />
          {this.renderSendBtn(item)}
          <hr />
        </MDBCollapse>
      </div>
    );
  }

  renderPersonMsg(item) {
    return (
      <Link href={`/messages?target=${item.mobile}`}>
        <MDBBtn>Messages [{this.countMessagesByContact(item.id)}]</MDBBtn>
      </Link>
    );
  }

  renderContacts() {
    const { contacts } = this.props;
    if (!contacts || !contacts.map) {
      return <div>No contacts found :( </div>;
    }
    return contacts.filter(this.userFilter()).map(item => {
      const contacDetails =
        item.type === "group"
          ? this.renderGroupDetails(item)
          : this.renderPersonDetails(item);
      const msgPanel =
        item.type === "group"
          ? this.renderGroupMsg(item)
          : this.renderPersonMsg(item);

      const imgSrc = !!item.profilePicThumb
        ? item.profilePicThumb
        : `/static/imgs/nopic_${item.type}.png`;

      return (
        <MDBListGroupItem key={item.id}>
          <MDBContainer>
            <MDBRow>
              <MDBCol size="2">
                <img width="100" height="100" src={imgSrc} />
              </MDBCol>
              <MDBCol size="9">{contacDetails}</MDBCol>
              <MDBCol size="1">
                <MDBInput
                  className="mt-n3"
                  type="checkbox"
                  id={`bulk_${item.id}`}
                  checked={
                    this.state.selectAll === true ||
                    this.state.selected[item.id]
                  }
                  onClick={e => {
                    const { selected } = this.state;
                    selected[item.id] = e.target.checked;
                    this.setState({ ...this.state, selected });
                  }}
                />
              </MDBCol>
            </MDBRow>
            <MDBRow>
              <MDBCol>{msgPanel}</MDBCol>
            </MDBRow>
          </MDBContainer>
        </MDBListGroupItem>
      );
    });
  }

  updateMsg(id, msg) {
    const state = this.state || {};
    state[`message_${id}`] = msg;
    this.setState(state);
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
    const { state } = this;
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
        <MDBBtn color="primary" onClick={_ => this.sendGroupMsg(item, true)}>
          Send to each Person
        </MDBBtn>
        <MDBBtn
          color="warning"
          className="ml-5"
          onClick={e => {
            const { msgPanelOpen } = this.state;
            msgPanelOpen[item.id] = false;
            this.setState({ ...this.state, msgPanelOpen });
          }}
        >
          Cancel
        </MDBBtn>
      </div>
    );
  }

  filter(type) {
    this.setState({ ...this.state, filter: type, selectAll: false });
  }

  renderFilterTitle() {
    if (this.state.filter === "person") {
      return "People";
    }
    return "Groups";
  }

  renderBulkMsg() {
    const closed = this.state.filter !== "group" || !this.state.selectAll;
    return (
      <MDBCollapse id="collapseBulkMsg" isOpen={!closed}>
        <MDBInput
          type="textarea"
          label="Broadcast messages to all selected group:"
          rows="5"
          onChange={e =>
            this.setState({ ...this.state, bulkMessage: e.target.value })
          }
          value={this.state.bulkMessage}
        />
        <MDBBtn onClick={_ => this.sendGroupMsg(item)}>
          Send to all selected groups
        </MDBBtn>
        <hr />
      </MDBCollapse>
    );
  }

  initialState() {
    return {
      filter: "group",
      selected: {},
      msgPanelOpen: {}
    };
  }

  renderFilters() {
    return (
      <MDBContainer>
        <MDBBtn
          size="sm"
          onClick={() => this.filter("all")}
          color={this.state.filter === "all" ? "primary" : "info"}
        >
          All
        </MDBBtn>
        <MDBBtn
          size="sm"
          onClick={() => this.filter("person")}
          color={this.state.filter === "person" ? "primary" : "info"}
        >
          People
        </MDBBtn>
        <MDBBtn
          size="sm"
          onClick={() => this.filter("group")}
          color={this.state.filter === "group" ? "primary" : "info"}
        >
          Groups
        </MDBBtn>
        <Link href="/newContact">
          <MDBBtn size="sm" className="ml-5">
            New Contact
          </MDBBtn>
        </Link>
      </MDBContainer>
    );
  }

  renderSelectAll() {
    return (
      <MDBContainer className="mb-3 pr-5">
        <MDBRow end>
          <MDBCol size="2" style={{ "text-align": "right" }}>
            Select All
          </MDBCol>
          <MDBCol size="1">
            <MDBInput
              type="checkbox"
              id="selectAll"
              className="mt-n4"
              onClick={e =>
                this.setState({ ...this.state, selectAll: e.target.checked })
              }
              checked={this.state.selectAll}
            />
          </MDBCol>
        </MDBRow>
      </MDBContainer>
    );
  }

  render() {
    this.state = this.state || this.initialState();
    return (
      <MDBContainer>
        <MDBCard
          className="card-body"
          style={{ width: "100%", marginTop: "1rem" }}
        >
          <MDBCardBody>
            <MDBCardTitle>{this.renderFilterTitle()}</MDBCardTitle>
            {this.renderFilters()}
            <hr />
            {this.renderBulkMsg()}
            {this.renderSelectAll()}
            <MDBContainer>
              <MDBListGroup>{this.renderContacts()}</MDBListGroup>
            </MDBContainer>
          </MDBCardBody>
        </MDBCard>
      </MDBContainer>
    );
  }
}

export default withAuth(Contacts);
