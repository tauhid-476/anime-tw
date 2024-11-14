"use client";

import { useState } from "react";
import { Heart, Loader2, Search, X } from "lucide-react";
import { useDebouncedCallback } from "use-debounce";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import axios from "axios";
import Link from "next/link";

interface Character {
  mal_id: number
  id: string;
  name: string;
  image: string;
  images: {
    jpg: {
      image_url: string
    }
  }
}

export default function Page() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Character[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  const [username, setUsername] = useState("");
  const [generatedMessage, setGeneratedMessage] = useState("");
  const [isMessageGenerated, setIsMessageGenerated] = useState(false);
  const [buttonLoading, setButtonLoading] = useState(false);
  const searchAPI = async (value: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`https://api.jikan.moe/v4/characters?q=${encodeURIComponent(value)}&limit=5`)
      const data = await response.json();

      const characters = data.data.map((char: Character) => ({
        id: char.mal_id,
        name: char.name,
        image: char.images.jpg.image_url
      }));
      setResults(characters)
    } catch (error) {
      console.error("Error fetching characters:", error);
      setResults([]);
    }
    setIsLoading(false);
  }

  const debouncedSearch = useDebouncedCallback((value) => {
    if (value) {
      searchAPI(value);
    } else {
      setResults([]);
    }
  }, 300);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    debouncedSearch(value);
  };

  const handleCharacterSelect = (character: Character) => {
    setSelectedCharacter(character);
    setQuery("");
    setResults([]);
  };

  const clearSelectedCharacter = () => {
    setSelectedCharacter(null);
    setQuery("");
    setGeneratedMessage("");
    setButtonLoading(false);
  };

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUsername(e.target.value);
  };

  const generateMessage = async () => {
    try {
      setButtonLoading(true);
      if (selectedCharacter && username) {
        const userData = await axios.get(`/api/users/${username}`);
        const message = await axios.post("/api/generate-message", {
          userData: userData.data,
          character: selectedCharacter.name,
        });
        setGeneratedMessage(message.data.analysis);
        setIsMessageGenerated(true);
      }

    } catch (error) {
      console.log(error)
    } finally {
      setButtonLoading(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4 space-y-6">
      <h1 className="text-center font-serif mt-2 text-2xl font-semibold mb-4">
        GET TO KNOW WHAT YOUR FAVORITE ANIME CHARACTER THINKS ABOUT YOU!
      </h1>

      <div className="w-full max-w-md mx-auto space-y-4">
        <div className="relative">
          {selectedCharacter ? (
            <div className="flex items-center border rounded-md pr-2 py-2 border-gray-700">
              <Avatar className="h-12 w-12 ml-2">
                {selectedCharacter.image ? (
                  <img className="h-12 w-12 object-cover" src={selectedCharacter.image} alt="v" />
                ) : (
                  <AvatarFallback>{selectedCharacter.name.charAt(0)}</AvatarFallback>
                )}
              </Avatar>
              <Input
                className="focus-visible:ring-0 border-none"
                value={selectedCharacter.name}
                readOnly
                disabled
              />
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={clearSelectedCharacter}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <>
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search anime characters..."
                className="pl-8 border-gray-700"
                value={query}
                onChange={handleSearch}
              />
            </>
          )}
        </div>

        {query && !selectedCharacter && (
          <Card className="rounded-lg bg-black text-white border-gray-700">
            <CardContent className="p-0">
              {isLoading ? (
                Array(3).fill(0).map((_, index) => (
                  <div key={index} className="flex items-center gap-3 p-4">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <Skeleton className="h-4 w-[200px]" />
                  </div>
                ))
              ) : results.length > 0 ? (
                results.map((character) => (
                  <div
                    key={character.id}
                    className="flex items-center gap-3 p-4 border border-gray-700 cursor-pointer"
                    onClick={() => handleCharacterSelect(character)}
                  >
                    <Avatar className="h-12 w-12 object-cover">
                      {character.image ? (
                        <AvatarImage src={character.image} alt={character.name} />
                      ) : (
                        <AvatarFallback>{character.name.charAt(0)}</AvatarFallback>
                      )}
                    </Avatar>
                    <span className="text-sm font-medium">{character.name}</span>
                  </div>
                ))
              ) : (
                <div className="p-4 text-sm text-muted-foreground text-center">
                  No characters found
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <Input
          placeholder="Enter your Twitter username"
          value={username}
          onChange={handleUsernameChange}
          className="border-gray-700"
        />

        <Button onClick={generateMessage}
          className={`text-center ${buttonLoading ? "bg-gray-400" : "bg-gray-700"}`}
        >
          {buttonLoading && <Loader2 className="animate-spin mr-2" />}
          Generate
        </Button>

        {selectedCharacter && isMessageGenerated && (
          <Card className="w-full p-6 bg-zinc-900 border-zinc-800 mt-6">
            <CardContent className="p-0">
              <div className="flex flex-col items-center gap-6">
                <img
                  src={selectedCharacter.image}
                  alt={selectedCharacter.name}
                  className="h-60"
                />
                <div className="space-y-2 text-center">
                  {generatedMessage && (
                    <div className="bg-zinc-800 p-4 rounded-lg mt-4 text-center">
                      <p className="text-zinc-100">{generatedMessage}</p>
                      <h2 className="text-2xl font-bold text-zinc-100">~ {selectedCharacter.name}</h2>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

        )}
      </div>
        <footer className="mt-auto pt-8 pb-4">
    <div className="flex flex-col items-center justify-center space-y-2">
      <div className="flex items-center space-x-2 font-serif">
        <span>Made with</span>
        <Heart className="h-4 w-4 text-red-500 animate-pulse" />
        <span>by</span>
        <Link 
          href="https://twitter.com/tauhid_khan476" 
          className="transition-colors font-medium underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          Me
        </Link>
      </div>
      hehe
    </div>
  </footer>
    </div>
  );

}
