"use client";

import Header from "@/components/layout/Header";
import Image from "next/image";
import { useRouter } from "next/navigation";

const not_found = () => {
  const router = useRouter();
  return (
    <div>
      <div className="w-[95%] text-center pt-26 mx-auto">
        <h1 className="text-3xl md:text-6xl font-bold">
          404 - You're not supposed to be here!!
        </h1>
        <Image
          src={"/tom_says_no.gif"}
          alt="Tom says no"
          width={200}
          height={200}
          className="mx-auto rounded-2xl mt-5 mb-10"
        />
        <p className="mt-10 text-2xl mb-8">
          The page you're looking for doesn't exist or has been moved !!
        </p>
        <button
          onClick={() => router.back()}
          className="py-2 px-10 border-2 border-primary rounded-xl hover:bg-primary hover:text-white"
        >
          Go Back{" "}
        </button>
      </div>
    </div>
  );
};

export default not_found;
