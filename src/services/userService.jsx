import { doc, updateDoc, getFirestore, setDoc } from 'firebase/firestore'

const createNewUserObject = ({ uid, firstName, lastName, email }) => {

    return {
        uid: uid,
        firstName: firstName,
        lastName: lastName,
        email: email,
        createdAt: new Date(),
    }

}

const createUserProfile = async (uid, userData) => {

    const db = getFirestore()
    const userRef = doc(db, 'users', uid)

    await setDoc(userRef, userData)

}

const updateUserInfo = async (uid, userData) => {

    const db = getFirestore()
    const userRef = doc(db, 'users', uid)

    await updateDoc(userRef, userData)

}

export {
    createNewUserObject,
    createUserProfile,
    updateUserInfo,
}