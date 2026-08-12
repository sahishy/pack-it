import { lstat, readFile, symlink, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const frontendRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const generatedPackageFile = path.join(frontendRoot, 'ios/App/CapApp-SPM/Package.swift')
const pluginSource = path.join(frontendRoot, 'node_modules/@capacitor-firebase/app-check')
const pluginAlias = path.join(frontendRoot, 'ios/App/CapacitorFirebaseAppCheck')

let aliasStat = null
try {
    aliasStat = await lstat(pluginAlias)
} catch (error) {
    if (error.code !== 'ENOENT') throw error
}

if (aliasStat && !aliasStat.isSymbolicLink()) {
    throw new Error(`Refusing to replace non-symlink path: ${pluginAlias}`)
}
if (!aliasStat) {
    await symlink(path.relative(path.dirname(pluginAlias), pluginSource), pluginAlias, 'dir')
}

const generatedPackage = await readFile(generatedPackageFile, 'utf8')
const conflictingPath = '../../../node_modules/@capacitor-firebase/app-check'
const aliasedPath = '../CapacitorFirebaseAppCheck'
if (generatedPackage.includes(conflictingPath)) {
    await writeFile(generatedPackageFile, generatedPackage.replaceAll(conflictingPath, aliasedPath))
}
