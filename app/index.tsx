import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useAction, useQuery } from 'convex/react';
import { api } from '../convex/_generated/api';
import { Link } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Dialog from 'react-native-dialog';

const Page = () => {
    const groups = useQuery(api.groups.get) || [];
    const [name, setName] = useState('');
    const [visible, setVisible] = useState(false);
    const [greeting, setGreeting] = useState('Welcome stranger!');

    // Load user name from AsyncStorage or prompt user to set a name
    useEffect(() => {
        const loadUser = async () => {
            const storedName = await AsyncStorage.getItem('user');
            if (storedName) {
                setName(storedName);
            } else {
                setVisible(true); // Prompt user to set a username
            }
        };
        loadUser();
    }, []);

    // Function to set user name in AsyncStorage and update state
    async function setUser(typeuser: string) {
        let userName = '';
        if (typeuser === 'user') {
            // Here you could add additional validation or processing if needed
            userName = name.trim(); // Trim whitespace from the name
        } else if (typeuser === 'anonimo') {
            userName = 'Anônimo';
        }
        
        await AsyncStorage.setItem('user', userName); // Store the user name
        setName(userName); // Update the name state
        setVisible(false); // Hide the dialog
    }

    // Fetch personalized greeting based on the user name
    const performGreetingAction = useAction(api.greetings.getGreeting);
    useEffect(() => {
        if (name) {
            const loadGreeting = async () => {
                const greeting = await performGreetingAction({ name });
                setGreeting(greeting);
            };
            loadGreeting();
        }
    }, [name]);

    return (
        <View style={{ flex: 1 }}>
            <ScrollView style={styles.container}>
                {groups.map((group) => (
                    <Link
                        key={group._id.toString()}
                        href={{ pathname: '/(chat)/[chatid]', params: { chatid: group._id } }}
                        asChild
                    >
                        <TouchableOpacity style={styles.group}>
                            <Image source={{ uri: group.icon_url }} style={styles.imageGroup} />
                            <View style={{ flex: 1 }}>
                                <Text>{group.name}</Text>
                                <Text style={{ color: '#888' }}>{group.description}</Text>
                            </View>
                        </TouchableOpacity>
                    </Link>
                ))}
                <Text style={{ textAlign: 'center', margin: 10 }}>{greeting}</Text>
            </ScrollView>

            <Dialog.Container visible={visible}>
                <Dialog.Title>Definir Nome de Usuário</Dialog.Title>
                <Dialog.Description>Digite seu nome de usuário:</Dialog.Description>
                <Dialog.Input onChangeText={setName} />
                <Dialog.Button label="Definir Nome" onPress={() => setUser('user')} />
                <Dialog.Button label="Anônimo" onPress={() => setUser('anonimo')} />
            </Dialog.Container>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 10,
        backgroundColor: '#F3F3F3'
    },
    group: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 10,
        borderRadius: 10,
        marginBottom: 10,
        shadowColor: '#000',
        elevation: 3,
        shadowOffset: {
            width: 0,
            height: 1
        },
        shadowOpacity: 0.22,
        shadowRadius: 2.22
    },
    imageGroup: {
        width: 50,
        height: 50,
        marginRight: 10,
        borderRadius: 25
    }
});

export default Page;
