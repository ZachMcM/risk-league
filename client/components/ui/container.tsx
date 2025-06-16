import { ReactNode } from "react"
import { View } from "react-native"

function Container({ children }: { children: ReactNode }) {
  return (
    <View className="flex flex-1 py-24 px-6">
      {children}
    </View>
  )
}

export { Container }