import { lstat, readFile, symlink, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const frontendRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const generatedPackageFile = path.join(frontendRoot, 'ios/App/CapApp-SPM/Package.swift')
const infoPlistFile = path.join(frontendRoot, 'ios/App/App/Info.plist')
const entitlementsFile = path.join(frontendRoot, 'ios/App/App/App.entitlements')
const appDelegateFile = path.join(frontendRoot, 'ios/App/App/AppDelegate.swift')
const capacitorConfigFile = path.join(frontendRoot, 'ios/App/App/capacitor.config.json')
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

const privacyEntries = [
    ['NSCameraUsageDescription', 'Pack-It uses the camera so you can ask travel and packing questions about a photo.'],
    ['NSMicrophoneUsageDescription', 'Pack-It uses the microphone to transcribe travel and packing questions.'],
    ['NSPhotoLibraryUsageDescription', 'Pack-It uses your photo library when you choose an image to ask a travel or packing question.'],
    ['NSPhotoLibraryAddUsageDescription', 'Pack-It can save a photo when you choose to add one to your device library.'],
]
let infoPlist = await readFile(infoPlistFile, 'utf8')
for (const [key, description] of privacyEntries) {
    if (!infoPlist.includes(`<key>${key}</key>`)) {
        infoPlist = infoPlist.replace(
            '</dict>',
            `\t<key>${key}</key>\n\t<string>${description}</string>\n</dict>`,
        )
    }
}
await writeFile(infoPlistFile, infoPlist)

let entitlements = await readFile(entitlementsFile, 'utf8')
entitlements = entitlements.replace(
    /\s*<key>com\.apple\.developer\.devicecheck\.appattest-environment<\/key>\s*<string>[^<]*<\/string>/,
    '',
)
await writeFile(entitlementsFile, entitlements)

let appDelegate = await readFile(appDelegateFile, 'utf8')
if (!appDelegate.includes('import HapticsPlugin')) {
    appDelegate = appDelegate.replace('import Capacitor', 'import Capacitor\nimport HapticsPlugin')
}
if (!appDelegate.includes('_ = HapticsPlugin.self')) {
    appDelegate = appDelegate.replace(
        'func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {',
        'func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {\n        // Keep the native haptics plugin linked for Capacitor runtime registration.\n        _ = HapticsPlugin.self',
    )
}
await writeFile(appDelegateFile, appDelegate)

const nativeHapticsPlugin = `
@objc(HapticFeedbackPlugin)
class HapticFeedbackPlugin: CAPPlugin, CAPBridgedPlugin {
    let identifier = "HapticFeedbackPlugin"
    let jsName = "HapticFeedback"
    let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "impact", returnType: CAPPluginReturnPromise),
    ]

    @objc func impact(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            let feedback = UIImpactFeedbackGenerator(style: .medium)
            feedback.prepare()
            feedback.impactOccurred()
        }
        call.resolve()
    }
}
`
if (!appDelegate.includes('@objc(HapticFeedbackPlugin)')) {
    appDelegate = appDelegate.replace('@UIApplicationMain', `${nativeHapticsPlugin}\n@UIApplicationMain`)
    await writeFile(appDelegateFile, appDelegate)
}

const capacitorConfig = JSON.parse(await readFile(capacitorConfigFile, 'utf8'))
capacitorConfig.packageClassList = [...new Set([
    ...(capacitorConfig.packageClassList ?? []),
    'HapticFeedbackPlugin',
])]
await writeFile(capacitorConfigFile, `${JSON.stringify(capacitorConfig, null, 2)}\n`)
