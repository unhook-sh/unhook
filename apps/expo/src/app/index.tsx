import { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Link, Stack } from "expo-router";
import { FlashList } from "@shopify/flash-list";

import type { RouterOutputs } from "~/utils/api";
import { api } from "~/utils/api";

function UserCard(props: {
  user: RouterOutputs["user"]["all"][number];
  onDelete: () => void;
}) {
  return (
    <View className="flex flex-row rounded-lg bg-muted p-4">
      <View className="flex-grow">
        <Link
          asChild
          href={{
            params: { id: props.user.id },
            pathname: "/user/[id]",
          }}
        >
          <Pressable className="">
            <Text className="text-xl font-semibold text-primary">
              {props.user.id}
            </Text>
            <Text className="mt-2 text-foreground">{props.user.id}</Text>
          </Pressable>
        </Link>
      </View>
      <Pressable onPress={props.onDelete}>
        <Text className="font-bold uppercase text-primary">Delete</Text>
      </Pressable>
    </View>
  );
}

function CreateUser() {
  const utils = api.useUtils();

  const [firstName, setFirstName] = useState("");

  const { mutate, error } = api.user.create.useMutation({
    async onSuccess() {
      setFirstName("");
      await utils.user.all.invalidate();
    },
  });

  return (
    <View className="mt-4 flex gap-2">
      <TextInput
        className="items-center rounded-md border border-input bg-background px-3 text-lg leading-[1.25] text-foreground"
        value={firstName}
        onChangeText={setFirstName}
        placeholder="Name"
      />
      {error?.data?.zodError?.fieldErrors.title && (
        <Text className="mb-2 text-destructive">
          {error.data.zodError.fieldErrors.title}
        </Text>
      )}
      <Pressable
        className="flex items-center rounded bg-primary p-2"
        onPress={() => {
          mutate({
            firstName,
          } as any);
        }}
      >
        <Text className="text-foreground">Create</Text>
      </Pressable>
      {error?.data?.code === "UNAUTHORIZED" && (
        <Text className="mt-2 text-destructive">
          You need to be logged in to create a post
        </Text>
      )}
    </View>
  );
}

export default function Index() {
  const utils = api.useUtils();

  const userQuery = api.user.all.useQuery();

  const deleteUserMutation = api.user.delete.useMutation({
    onSettled: () => utils.user.all.invalidate().then(),
  });

  return (
    <SafeAreaView className="bg-background">
      {/* Changes page title visible on the header */}
      <Stack.Screen options={{ title: "Home Page" }} />
      <View className="h-full w-full bg-background p-4">
        <Text className="pb-2 text-center text-5xl font-bold text-foreground">
          Create <Text className="text-primary">T3</Text> Turbo
        </Text>

        <Pressable
          onPress={() => void utils.user.all.invalidate()}
          className="flex items-center rounded-lg bg-primary p-2"
        >
          <Text className="text-foreground"> Refresh posts</Text>
        </Pressable>

        <View className="py-2">
          <Text className="font-semibold italic text-primary">
            Press on a post
          </Text>
        </View>

        <FlashList
          data={userQuery.data}
          estimatedItemSize={20}
          ItemSeparatorComponent={() => <View className="h-2" />}
          renderItem={(p) => (
            <UserCard
              user={p.item}
              onDelete={() => deleteUserMutation.mutate(p.item.id)}
            />
          )}
        />

        <CreateUser />
      </View>
    </SafeAreaView>
  );
}
