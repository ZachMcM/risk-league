import { ReactNode } from "react"
import { KeyboardAvoidingView, View } from "react-native"

function Container({ children }: { children?: ReactNode }) {
  return (
    <KeyboardAvoidingView  className="flex-1 flex" behavior="padding">
      <View className="flex flex-1 py-24 px-4">
        {children}
      </View>
    </KeyboardAvoidingView>
  )
}

export { Container }