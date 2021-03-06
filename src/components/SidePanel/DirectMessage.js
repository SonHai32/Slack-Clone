import React from 'react'
import {Menu, Icon} from 'semantic-ui-react'
import {connect} from 'react-redux'
import {setCurrentChannel,setPrivateChannel} from '../../action'

import firebase from '../../firebase'

class DirectMessage extends React.Component{

    state= {
        users: [],
        user: this.props.currentUser,
        userRef: firebase.database().ref('users'),
        connectRef: firebase.database().ref('.info/connected'),
        presenceRef: firebase.database().ref('presence'),
        activeChannel: ''


    }

    componentDidMount() {
        if(this.state.user){
            this.addListeners(this.state.user.uid);
        }
    }

    addListeners = currentUserUid =>{
        let loadUsers = [];
        this.state.userRef.on('child_added', snap =>{
            if(currentUserUid !== snap.key){
                let user = snap.val();
                user['uid'] = snap.key;
                user['status'] = 'offline';
                loadUsers.push(user);
                this.setState({users: loadUsers});
            }
        });

        this.state.connectRef.on('value', snap=>{
            if(snap.val() === true){
                const ref = this.state.presenceRef.child(currentUserUid);
                ref.set(true);
                ref.onDisconnect().remove(err =>{
                    if(err !== null){
                        console.log(err);
                    }
                })
            }    
        });

        this.state.presenceRef.on('child_added', snap =>{
            if(currentUserUid !== snap.key){
                //add status to user
                this.addStatusToUser(snap.key)
            }
        })

        this.state.presenceRef.on('child_removed', snap =>{
            this.addStatusToUser(snap.key, false)
        })  
    }   

    addStatusToUser = (userId, connected = true) =>{
        const updatedUsers = this.state.users.reduce((acc,user)=>{
            if(user.uid === userId){
                user['status'] = connected ? 'online' : 'offline';
            }
            return acc.concat(user);
        },[])
        
        this.setState({user: updatedUsers})

    }

    isUserOnline = user => user.status === 'online'

    changeChannel = user =>{
        const channelId = this.getChannelId(user.uid);
        const changeData = {
            id: channelId,
            name: user.name
        }
        this.props.setCurrentChannel(changeData);
        this.props.setPrivateChannel(true);
        this.setActiveChannel(user.uid);
    }

    getChannelId = userId =>{
        const currentUserId = this.state.user.uid;

        return userId < currentUserId ? (userId+'/'+currentUserId) : (currentUserId+'/'+userId);
        
    }

    setActiveChannel = userId =>{
        this.setState({activeChannel: userId})
    }

    render(){

        const {users,activeChannel} = this.state;

        return(
            <Menu.Menu className="direct__messages">
                <Menu.Item>
                    <span>
                        <Icon name="mail" /> Messages
                    </span>{' '}
                    {users.length}
                </Menu.Item>

                {users.map(user =>(
                    <Menu.Item
                        key={user.uid}
                        onClick={()=>{this.changeChannel(user)}}
                        style={{opacity: 0.7, fontStyle: 'italic'}}
                        active={user.uid === activeChannel}
                    >
                        <Icon 
                            name = "circle" color = {this.isUserOnline(user) ? 'green' : 'red'}
                        />
                        @ {user.name}

                        
                    </Menu.Item>
                ))}
        

            </Menu.Menu>
        ); 
    }

}

export default connect(null,{setCurrentChannel,setPrivateChannel})(DirectMessage);