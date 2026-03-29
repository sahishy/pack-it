import { doc, updateDoc, getFirestore, setDoc, onSnapshot } from 'firebase/firestore'

const createNewUserObject = ({ uid, firstName, lastName, email, profilePictureUrl = '' }) => {

    return {
        uid: uid,
        firstName: firstName,
        lastName: lastName,
        email: email,
        profilePictureUrl: profilePictureUrl,
        createdAt: new Date(),
    }

}

const createUserProfile = async (uid, userData, options = {}) => {

    const db = getFirestore()
    const userRef = doc(db, 'users', uid)

    await setDoc(userRef, userData, options)

}

const updateUserInfo = async (uid, userData) => {

    const db = getFirestore()
    const userRef = doc(db, 'users', uid)

    await updateDoc(userRef, userData)

}

const subscribeToUserProfile = (uid, onNext, onError) => {

    const db = getFirestore()
    const userRef = doc(db, 'users', uid)

    return onSnapshot(
        userRef,
        (snapshot) => {
            if (snapshot.exists()) {
                onNext(snapshot.data())
            } else {
                onNext(null)
            }
        },
        onError,
    )

}

export {
    createNewUserObject,
    createUserProfile,
    updateUserInfo,
    subscribeToUserProfile,
}