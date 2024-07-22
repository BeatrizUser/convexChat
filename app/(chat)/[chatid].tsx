import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import { useLocalSearchParams, useNavigation } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useConvex, useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Doc, Id } from '@/convex/_generated/dataModel';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

const Page = () => {
  const { chatid } = useLocalSearchParams();
  const [user, setUser] = useState<string | null>(null);
  const convex = useConvex();
  const navigation = useNavigation();
  const [newMessage, setNewMessage] = useState('');
  const addMessage = useMutation(api.messages.sendMessage);
  const messages = useQuery(api.messages.get, { chatId: chatid as Id<'groups'> }) || [];
  const listRef = useRef<FlatList>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const loadGroup = async () => {
      const groupInfo = await convex.query(api.groups.getGroup, { id: chatid as Id<'groups'> });
      navigation.setOptions({ headerTitle: groupInfo?.name });
    };
    loadGroup();
  }, [chatid, convex, navigation]);

  // Load user from async storage
  useEffect(() => {
    const loadUser = async () => {
      const user = await AsyncStorage.getItem('user');
      setUser(user);
    };

    loadUser();
  }, []);

  useEffect(() => {
    setTimeout(() => {
      listRef.current?.scrollToEnd({ animated: true });
    }, 300);
  }, [messages]);

  const handleSendMessage = async () => {
    Keyboard.dismiss();

    if (selectedImage) {
      setUploading(true);
      const url = `${process.env.EXPO_PUBLIC_CONVEX_SITE}/sendImage?user=${encodeURIComponent(
        user!
      )}&group_id=${chatid}&content=${encodeURIComponent(newMessage)}`;

      const response = await fetch(selectedImage);
      const blob = await response.blob();

      fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': blob.type! },
        body: blob,
      })
        .then(() => {
          setSelectedImage(null);
          setNewMessage('');
        })
        .catch((err) => console.log(err))
        .finally(() => setUploading(false));
    } else {
      addMessage({
        group_id: chatid as Id<'groups'>,
        content: newMessage,
        user: user || 'Anon',
      });
    }

    setNewMessage('');
  };

  const renderMessage = ({ item }: { item: Doc<'messages'> }) => {
    if (!item) {
      return null; // Retornar null se item for undefined
    }

    const isUserMessage = item.user === user;

    return (
      <View style={isUserMessage ? styles.userMessageContainer : styles.otherMessageContainer}>
        <View style={{ right: 55, width: 0, height: 10, top: -10 }}>
          {!isUserMessage && (  // Verifica se isUserMessage é verdadeiro
            <Image
              source={{ uri: `https://api.dicebear.com/9.x/big-smile/png?seed=${item.user}` }}
              style={{ width: 50, height: 50, backgroundColor: '#ffd5dc', borderRadius: 25 }}
            />
          )}
        </View>

        <View>
          {item.content !== '' && (
          <Text style={[styles.messageText, isUserMessage ? styles.userMessageText : null]}>
            {item.content}
          </Text>
          )}

          {item.file && <Image source={{ uri: item.file }} style={{ width: 200, height: 200, margin: 10 }} />}

          <Text style={isUserMessage ? styles.userTimestamp : styles.otherTimestamp}>
          {isUserMessage ? 'Enviada por mim' : `Enviado por ${item.user}`}
          </Text>
        </View>
      </View>
    );
  };

  const captureImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
    });

    if (!result.canceled && result.assets.length > 0) {
      const uri = result.assets[0].uri;
      setSelectedImage(uri);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={100}
      >
        <FlatList
          ref={listRef}
          ListFooterComponent={<View style={{ padding: 10 }} />}
          data={messages}
          renderItem={({ item }) => renderMessage({ item })}
          keyExtractor={(item) => item._id.toString()}
        />

        {/* Bottom input */}
        <View style={styles.inputContainer}>
          {selectedImage && (
            <Image source={{ uri: selectedImage }} style={{ width: 200, height: 200, margin: 10 }} />
          )}
          <View style={{ flexDirection: 'row' }}>
            <View style={styles.textInputContainer}>
              <Image source={require('../../assets/images/automessage-icon.png')} style={{ width: 20, height: 20 }}/>
              <TextInput
                style={styles.textInput}
                value={newMessage}
                onChangeText={setNewMessage}
                placeholder="Toque aqui para digitar"
                multiline={true}
              />
            </View>

            {/* <TouchableOpacity style={styles.sendButton} onPress={captureImage}>
              <Ionicons name="add-outline" style={styles.sendButtonText}></Ionicons>
            </TouchableOpacity> */}
            <TouchableOpacity
              style={styles.sendButton}
              onPress={handleSendMessage}
              disabled={newMessage === ''}
            >
              <Ionicons name="send-outline" style={styles.sendButtonText}></Ionicons>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* Cover screen while uploading image */}
      {uploading && (
        <View
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor: 'rgba(0,0,0,0.4)',
              alignItems: 'center',
              justifyContent: 'center',
            },
          ]}
        >
          <ActivityIndicator color="#fff" animating size="large" />
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F1F1F1',
  },
  inputContainer: {
    padding: 20,
    backgroundColor: '#fff',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -8,
    },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  textInputContainer: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#E6E6E6',
    borderRadius: 20,
    height: 40,
    backgroundColor: '#fff',
    textAlignVertical: 'center',
    padding: 10,
    width: '90%',
  },
  textInput: {
    marginLeft: 10,
  },
  sendButton: {
    backgroundColor: '#fff',
    borderRadius: 50,
    padding: 10,
    borderWidth: 1,
    borderColor: '#FC2D3F',
    width: 40,
    height: 40,
    marginLeft: 10,
  },
  sendButtonText: {
    color: '#FC2D3F',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: 'bold',
  },

  userMessageContainer: {
	flexDirection: 'row',
    backgroundColor: '#FC2D3F',
    alignSelf: 'flex-end',
    padding: 10,
    borderRadius: 16,
    borderTopRightRadius: 0,
    borderBottomRightRadius: 16,
    borderBottomLeftRadius: 16,
    margin: 2,
    marginTop: 5,
    marginHorizontal: 10,
    maxWidth: '60%',
  },

  otherMessageContainer: {
	flexDirection: 'row',
    alignSelf: 'flex-start',
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 0,
    borderTopRightRadius: 16,
    borderBottomRightRadius: 16,
    borderBottomLeftRadius: 16,
    margin: 2,
    marginTop: 5,
    marginHorizontal: 55,
    maxWidth: '60%',
  },
  messageText: {
    fontSize: 16,
    flexWrap: 'wrap',
  },
  userMessageText: {
    color: '#fff',
  },
  userTimestamp: {
    fontSize: 12,
    color: '#FDFDFDB6',
  },
  otherTimestamp: {
    fontSize: 12,
    color: '#00000071',
  },
});

export default Page;
